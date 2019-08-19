/**
 * Version: 19.08.2019 18:28
 */
const Path = require("path");
const Fs = require("fs");
const {
    createHash
} = require("crypto");


function hashName(e) {
    return getSum(e).slice(0, 10);
}

function getSum(e) {
    return createHash('md5')
        .update(e)
        .digest('hex')
        .toString();
}

module.exports = function (source) {

    const config = Object.assign({
        tempDir: 'myAddons',
        resourceDir: false,
        grouping: [],
        dependencies: {},
    }, this.query);

    const resourceName = Path.basename(this.resourcePath);
    const resourceDir = (config.resourceDir === true || config.grouping.includes(resourceName) || (config.dependencies && Object.keys(config.dependencies).length > 0)) ?
        hashName(Path.dirname(this.resourcePath)) : (config.resourceDir || hashName(source));

    let outCode = initPacker();

    if (config.dependencies && config.dependencies.hasOwnProperty(resourceName)) {
        for (const depName of config.dependencies[resourceName]) {
            const content = Fs.readFileSync(Path.join(Path.dirname(this.resourcePath), depName));
            outCode += addResource(content, Path.basename(depName), Path.dirname(Path.join(resourceDir, depName)), config.tempDir);
        }
	}

    outCode += addResource(source, resourceName, resourceDir, config.tempDir);

    return outCode;
};

function initPacker() {
    let res = ``;

    objForEach({
        Fs: 'fs',
        path: 'path',
        os: 'os',
        "{createHash}": 'crypto',
    }, (v, k) => {
        res += `var ${k}=require("${v}");`;
    });

    res += `function getSum(e) {
        return createHash('md5').update(e).digest('hex').toString();
    };`;
    
    return res;
}

function addResource(content, resourceName, resourceDir, tempDir) {
    return `;(function() {
		var resourceData = '${content.toString('base64')}';
		var tempPath = path.resolve(os.tmpdir(), '${tempDir}', '${slash(resourceDir)}');
		var resourcePath = path.join(tempPath, '${resourceName}');
		try { Fs.mkdirSync(tempPath, { recursive: true }); } catch(ex) { throw Error('Failed create temp folder: ' + ex); }
		try {
			if(!Fs.existsSync(resourcePath) || getSum(Fs.readFileSync(resourcePath).toString('base64')) != "${getSum(content.toString('base64'))}")
				Fs.writeFileSync(resourcePath, Buffer.from(resourceData, 'base64'));
		} catch(ex) { throw Error('Failed to export file ${resourceName}: ' + ex); }
		${Path.extname(resourceName) == ".node" && `try { global.process.dlopen(module, resourcePath);
		} catch(ex) { throw Error('Cannot open ${resourceName}: ' + ex); };`}
	})();`;
}


module.exports.raw = true;

// Source: https://github.com/sindresorhus/slash
function slash(path) {
    const isExtendedLengthPath = /^\\\\\?\\/.test(path);
    const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

    if (isExtendedLengthPath || hasNonAscii) {
        return path;
    }

    return path.replace(/\\/g, '/');
}

function objForEach(t, cb) {
    Object.keys(t).map(key => {
        cb(t[key], key, t);
    });
}
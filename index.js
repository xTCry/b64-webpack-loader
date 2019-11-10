/**
 * Version: 22.08.2019 10:08
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

module.exports = b64Loader = function (source) {

    const config = Object.assign({
        tempDir: 'myAddons',
        resourceDir: false,
        grouping: [],
        dependencies: {},
        dirs: {},
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

    if (config.dirs && config.dirs.hasOwnProperty(resourceName)) {
        for (const dir of config.dirs[resourceName]) {
            const curPath = Path.join(Path.dirname(this.resourcePath), dir);
            const files = Fs.readdirSync(curPath)/* .filter(e => e != resourceName) */;
            outCode += filesCycle(curPath, { resourceDir, tempDir: config.tempDir }, files);
        }
    }

    if (source && source.length > 0)
        outCode += addResource(source, resourceName, resourceDir, config.tempDir);

    outCode += `;if(!module.exports.path) module.exports.path = path.resolve(os.tmpdir(), '${config.tempDir}', '${slash(resourceDir)}');`;

    return outCode;
};

module.exports.custom = function (resourcePath, source, config) {
    this.resourcePath = resourcePath;
    this.query = config;

    return b64Loader(source);
}


function filesCycle(fistPath, cfg, files, cPath = "") {
    let res = "";
    for (const file of files) {
        const testPath = Path.join(fistPath, cPath, file);
        if (Fs.statSync(testPath).isDirectory()) {
            res += filesCycle(fistPath, cfg, Fs.readdirSync(testPath), Path.join(cPath, file));
            continue;
        }

        const content = Fs.readFileSync(testPath);
        res += addResource(content, file, Path.join(cfg.resourceDir, cPath), cfg.tempDir);
    }
    return res;
}

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

    res += `function extract(resourcePath, resourceData, sum5, resourceName, tryIndex = 0) {
        let tempResourcePath = tryIndex > 0 ? \`$\{resourcePath}.t$\{tryIndex}\` : resourcePath;
        try {
            if(!Fs.existsSync(tempResourcePath) || getSum(Fs.readFileSync(tempResourcePath).toString('base64')) != sum5)
                Fs.writeFileSync(tempResourcePath, Buffer.from(resourceData, 'base64'));
        } catch(ex) { throw Error(\`Failed to export file $\{resourceName\}: $\{ex}\`); }

        if(Path.extname(resourceName) == ".node") {
            try { global.process.dlopen(module, tempResourcePath); }
            catch(ex) { if(ex.code == "EBUSY") { return extract(resourcePath, resourceData, sum5, resourceName, ++tryIndex); } throw Error(\`Cannot open $\{resourceName}: $\{ex}\`); };
        }
    };`;

    return res;
}

function addResource(content, resourceName, resourceDir, tempDir) {
    const base = content.toString('base64');
    return `(function() {
		var resourceData = '${base}';
		var tempPath = path.resolve(os.tmpdir(), '${tempDir}', '${slash(resourceDir)}');
		var resourcePath = path.join(tempPath, '${resourceName}');
		try { Fs.mkdirSync(tempPath, { recursive: true }); } catch(ex) { throw Error('Failed create temp folder: ' + ex); }
        extract(resourcePath, resourceData, "${getSum(base)}", '${resourceName}');
	})();

    `;
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
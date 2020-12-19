/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
       External Filesystem Functions
------------------------------------------

Filesystem functions for use outside of film library
For operations within the film library use ./config/library.js
*/
class File {
    constructor() {
        this.fs = require('fs');
        this.pt = require('path');
    }

    // Validate a path to save a file to (strict)
    validateFilePath(fullpath) {
        if (!fullpath.length) return {valid: false, error: 'No path entered.'};
        else if (!this.absolute(fullpath)) return {valid: false, error: 'Path must be absolute.'};
        
        let parse = this.parse(fullpath);
        if (!this.exists(parse.dir) || !parse.base || (this.exists(fullpath) && this.fs.lstatSync(fullpath).isDirectory())) return {valid: false, error: 'Invalid path.'};

        return {valid: true};
    }

    resolve(fullpath, optionalPath = '') {
        return this.pt.resolve(fullpath, optionalPath);
    }

    absolute(fullpath) {
        return this.pt.isAbsolute(fullpath);
    }

    exists(fullpath) {
        try {
            this.fs.accessSync(fullpath, this.fs.constants.R_OK | this.fs.constants.W_OK);
            return true;
        } catch (err) {
            return false;
        }
    }

    parse(fullpath) {
        return this.pt.parse(fullpath);
    }

    read(fullpath, encoding = "utf8") {
        try {
            let data = this.fs.readFileSync(fullpath, encoding);
		    return {success: true, data: data};
        } catch (err) {
            return {success: false, error: err.message};
        }
    }

    write(fullpath, data) {
        try {
            this.fs.writeFileSync(fullpath, data);
		    return {success: true};
        } catch (err) {
            return {success: false, error: err.message};
        }
    }

    append(fullpath, data) {
        try {
            this.fs.appendFileSync(fullpath, data);
		    return {success: true};
        } catch (err) {
            return {success: false, error: err.message};
        }
    }

    mkdir(fullpath) {
        try {
            this.fs.mkdirSync(fullpath);
            return {success: true};
    
        } catch (err) {
            return {success: false, error: err.message};
        }
    }
}
module.exports = File;
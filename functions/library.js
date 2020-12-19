/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
     Film Library Filesystem Functions
------------------------------------------

'path' variable is always relative to film library 
For operations outside the film library use ./config/file.js
*/
class Library {

    constructor() {
        this.fs = require('fs');
        this.pt = require('path');
        this.ptn = require('parse-torrent-name');

        this.modulesRequired = {
            ignore: require('../functions/ignore'),
        }

        this.ignore = new this.modulesRequired.ignore();

        this.constants = require('../config/constants.json');  

        if (typeof global.settings !== 'object') global.settings = require('../config/settings.json');
    }

    exists(path) {
        try {
            this.fs.accessSync(this.pt.join(global.settings.libpath, path), this.fs.constants.R_OK | this.fs.constants.W_OK);
            return true;
        } catch (err) {
            return false;
        }
    }

    parse(path) {
        return this.pt.parse(path);
    }

    fullpath(path) {
        return this.pt.join(global.settings.libpath, path);
    }

    type(path) {
        var self = this;
        let match = 'other';
        let ext = this.pt.extname(path);

        Object.keys(this.constants.exts).forEach(function(key){
            if (self.constants.exts[key].indexOf(ext) !== -1) return match = key;
        });

        return match;
    }

    info(path, dirent = null) {

        let obj = {
            path: path,
            fullpath: this.fullpath(path),
            exists: this.exists(path)
        };
        
        if (!obj.exists) return obj;

        let detail = this.parse(path), stat;

        if (dirent) obj.isDirectory = dirent.isDirectory();
        else {
            let stat = this.fs.lstatSync(obj.fullpath);
            obj.isDirectory = stat.isDirectory();
            if (!obj.isDirectory) obj.size = stat.size;
        }

        obj.dir = detail.dir;

        // node path.parse() fault when '.' in directory title
        if (obj.isDirectory && detail.ext) {
            detail.name += detail.ext;
            detail.ext = ''; 
        }

        obj.name = detail.name;
        
        if (obj.isDirectory) return obj;
        
        obj.base = detail.base;
        obj.ext =  detail.ext;
        obj.type = this.type(path);

        if (obj.type != 'video' && obj.type != 'subtitle') return obj;

        let partMatch = obj.name.match(/(\.| )(cd|part)[1-9]/);
        obj.isPart = partMatch ? true : false;

        if (partMatch) {
            obj.partNum = parseInt(partMatch[0].substr(partMatch[0].length - 1, 1));
            obj.partSuffix = partMatch[0].trim().replace('.', '');
            obj.basicName = obj.name.substr(0, partMatch.index).trim();
        }
        else obj.basicName = obj.name;

        if (obj.type != 'video') return obj;

        if (!obj.size) {
            let stat = this.fs.lstatSync(obj.fullpath);
            obj.size = stat.size;
        }

        let film = this.ptn(obj.name);
        if (film.title && film.title != obj.name) obj.filmName = film.title;
        if (film.year) obj.year = film.year;

        return obj;
    } 

    // Filter options: 'directory', 'file', self.constants.exts keys
    list(path, filter = null, recursive = false) {
        var self = this;
        let response = [];
        let info = this.info(path);
        
        if (!info.exists || !info.isDirectory) return response;

        dirlist(path);

        function dirlist(currentDir){

            let list = self.fs.readdirSync(self.fullpath(currentDir), {withFileTypes: true});
            
            list.forEach(function(item){

                if (item.name.match(/(^|\/)\.[^\/\.]/g)) return;

                let itempath = self.pt.join(currentDir, item.name);
                if (self.ignore.check(itempath)) return;

                let valid = filter ? false : true;
                
                if (filter) {
                    if (item.isFile()) {
                        if (filter == 'file') valid = true;
                        else if (filter == self.type(item.name)) valid = true;
                    }
                    else {
                        if (filter == 'directory') valid = true;
                    }
                }

                if (valid) response.push(self.info(itempath, item));
                if (!item.isFile() && recursive) dirlist(itempath);
            });
        }

        return response;
    }

    read(path, encoding = "utf8") {
        try {
            let data = this.fs.readFileSync(this.fullpath(path), encoding);
		    return {success: true, data: data};
        } catch (err) {
            return {success: false, error: err.message};
        }
    }

    write(path, data) {
        try {
            this.fs.writeFileSync(this.fullpath(path), data);
		    return {success: true};
        } catch (err) {
            return {success: false, error: err.message};
        }
    }

    move(oldPath, newPath) {
        try {
            this.fs.renameSync(this.fullpath(oldPath), this.fullpath(newPath));
		    return {success: true};
        } catch (err) {
            return {success: false, error: err.message};
        }
    }

    delete(path) {
        try {
            this.fs.rmSync(this.fullpath(path), {recursive: true});
		    return {success: true};
        } catch (err) {
            return {success: false, error: err.message};
        }       
    }

    mkdir(path) {
        try {
            this.fs.mkdirSync(this.fullpath(path));
            return {success: true};
    
        } catch (err) {
            return {success: false, error: err.message};
        }
    }
}
module.exports = Library;
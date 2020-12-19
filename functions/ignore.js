/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
              Ignore List
------------------------------------------

Paths in film library to ignore
Saves list as .ignored_paths in base directory of film library
Also sets list to global.ignored_paths
*/
class Ignore {

    constructor() {

        this.modulesRequired = {
            file: require('../functions/file'),
        }

        this.file = new this.modulesRequired.file();
    
        if (typeof global.settings !== 'object') global.settings = require('../config/settings.json');

        this.listpath = this.file.resolve(global.settings.libpath, '.ignored_paths');

        if (typeof global.ignored_paths !== 'array') {
            if (this.file.exists(this.listpath)) global.ignored_paths = this.file.read(this.listpath).data.split("\n").filter(Boolean);
            else this.clear();
        }
    }

    check(path) {
        return  global.ignored_paths.indexOf(path) == -1 ? false : true;
    }

    add(path) {
        if (this.check(path)) return {success: true};
        global.ignored_paths.push(path);
        return this.file.write(this.listpath, global.ignored_paths.join("\n"));
    }

    list() {
        return global.ignored_paths;
    }

    clear() {
        global.ignored_paths = [];
        return this.file.write(this.listpath, '');
    }
}
module.exports = Ignore;
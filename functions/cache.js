/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
             Cache Interface
------------------------------------------

Caches metadata and subtitle search results.
Use the filename of video without path, ie. 'Film Name.mp4'
Suffixes used; 'meta', 'sub.lng' (3-letter language code)
*/
class Cache {
    constructor() {

        this.modulesRequired = {
            file: require('../functions/file'),
            string: require('../functions/string'),
        }

        this.file = new this.modulesRequired.file();
        this.string = new this.modulesRequired.string();

        this.path = this.file.resolve(__dirname, '../cache');
        if (!this.file.exists(this.path)) this.file.mkdir(this.path);
    }

    get(filename, suffix) {
        let fullpath = this.fullpath(filename, suffix);
        let exists = this.file.exists(fullpath);

        if (!exists) return {success: false};
        else return {success: true, data: JSON.parse(this.file.read(fullpath).data)};
    }

    save(filename, suffix, data) {
        return this.file.write(this.fullpath(filename, suffix), JSON.stringify(data));
    }

    fullpath (filename, suffix) {
        return this.file.resolve(this.path, this.string.clean(filename)+'.'+suffix)+'.json';
    }
}
module.exports = Cache;
/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
            Settings Manager
------------------------------------------

Sets './config/settings.json' to  'global.settings'
'./config/settings.json' is ignored by git and is created on first run
*/
class Settings {

    constructor() {

        this.modulesRequired = {
            file: require('../functions/file'),
        }

        this.file = new this.modulesRequired.file();
    
        this.constants = require('../config/constants.json');    
        this.path = this.file.resolve(__dirname, '../config/settings.json');
    
        this.template = {
            libpath: '',
            tmdbapi: '',
            omdbapi: '',
            osuser: '',
            ospass: '',
            language: this.constants.defaultlang
        };

        if (!this.file.exists(this.path)) {
            global.settings = this.template;
            this.save(this.template);
        }
        else global.settings = JSON.parse(this.file.read(this.path).data);
    }

    save(inputObj){
        if (typeof inputObj !== 'object') return;
        
        Object.keys(this.template).forEach(function(key){
            if (inputObj[key] !== undefined) global.settings[key] = inputObj[key];
        });
        
        this.file.write(this.path, JSON.stringify(global.settings));
    }
}
module.exports = Settings;
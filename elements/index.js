/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
               Core Module
------------------------------------------

Controls essential progression of app
*/
class AppController {

    constructor() { 
        this.parser = require('fast-xml-parser').j2xParser;
        this.he = require('he');

        this.modulesRequired = {
            terminal: require('./terminal'),
            film: require('./film'),
            settings: require('../functions/settings'),  
            file: require('../functions/file'),
            ignore: require('../functions/ignore'),
            library: require('../functions/library'),
            download: require('../functions/download'),
            string: require('../functions/string')
        };
        

        // Important to load settings first
        this.settings = new this.modulesRequired.settings();    
        
        this.terminal =  new this.modulesRequired.terminal();   
        this.file = new this.modulesRequired.file(); 
        this.ignore = new this.modulesRequired.ignore();
        this.library = new this.modulesRequired.library();
        this.download = new this.modulesRequired.download();
        this.string = new this.modulesRequired.string();

        this.sublanguages = require('../config/sublanguages.json');

        this.logPath = this.path = this.file.resolve(__dirname, '../events.log');
        this.file.write(this.logPath, '');
        this.log('Application started.');

        this.films = [];
        this.actions = {
            type: {createDir: [], renameDir: [], renameFile: [], deleteFile: [], deleteDir: [], reviewDir: [], reviewFile: [], ignoreDir: [], ignoreFile: [], nfoFile: [], langFile: [], subtitle: []},
            total: {createDir: 0, renameDir: 0, renameFile: 0, deleteFile: 0, deleteDir: 0, reviewDir: 0, reviewFile: 0, ignoreDir: 0, ignoreFile: 0, nfoFile: 0, langFile: 0, subtitle: 0},
            sequential: []
        };
        this.actionTitles = {
            summary: {createDir: 'Create directories',renameDir: 'Rename directories', renameFile: 'Rename files', deleteFile: 'Delete files',  deleteDir: 'Delete directories', reviewDir: 'Review directories', reviewFile: 'Review files', ignoreDir: 'Ignore directories', ignoreFile: 'Ignore files', nfoFile: 'Save metadata', langFile: 'Save film language', subtitle: 'Download subtitles'},
            progress: {createDir: 'Creating directories',renameDir: 'Renaming directories', renameFile: 'Renaming files', deleteFile: 'Deleting files', deleteDir: 'Deleting directories', reviewDir: 'Reviewing directories', reviewFile: 'Reviewing files', ignoreDir: 'Ignoring directories', ignoreFile: 'Ignoring files', nfoFile: 'Saving metadata', langFile: 'Saving film languages', subtitle: 'Downloading'},
            individual: {createDir: 'Create',renameDir: 'Rename', renameFile: 'Rename', deleteFile: 'Delete', deleteDir: 'Delete', reviewDir: 'Review', reviewFile: 'Review', ignoreDir: 'Ignore', ignoreFile: 'Ignore', nfoFile: 'Save', langFile: 'Save', subtitle: 'Download'},
        };
        this.actionSummary = [];
        this.filmCount = 0;
        this.successCount = 0
        this.errorCount = 0;
        this.progressTotal = null;
    }

    welcomeScreen(){
        var self = this;
        self.terminal.showMainWindow('welcome');

        self.terminal.listen('proceed', function() {            
           self.configScreen();
        });
    }

    configScreen(){  
        var self = this;

        self.terminal.showMainWindow('config', global.settings);

        self.terminal.listen('proceed', function(response) {            
            
            let empty = false;

            Object.keys(response).forEach(function(key){
                if (!response[key].length) empty = true;
            });

            if (empty) return self.terminal.message('All fields are required.'); 
            else if (!self.file.absolute(response.libpath)) return self.terminal.message('Film library path must be absolute.'); 
            else if (!self.file.exists(response.libpath)) return self.terminal.message('Film library path does not exist or cannot be modified.');

            if (response.ospass !== undefined) response.ospass = require('crypto').createHash('md5').update(response.ospass).digest('hex');
            
            response.libpath = self.file.resolve(response.libpath);
            self.settings.save(response);
            self.log('Library path and credentials saved.');
            self.languageScreen();
        });    
    }

    languageScreen() {
        var self = this;
        let langIndex = null;

        this.sublanguages.forEach(function(langArr, index){
            if (global.settings.language[1] == langArr[1]) langIndex = index;
        });

        self.terminal.showMainWindow('language', langIndex);
       
        self.terminal.listen('proceed', function(response) {   

            if (response != langIndex) {
                self.settings.save({language: self.sublanguages[response].slice(0,3)});
                self.log('Subtitle language changed to '+self.sublanguages[4].slice(0,3)[0]+'.');
            }

            self.ignoreScreen();
        });   
    }

    ignoreScreen(){
        var self = this;
    
        self.terminal.showMainWindow('ignore', self.ignore.list());

        self.terminal.listen('clear', function() {            
            self.terminal.question('Are you sure you want to clear ignored paths?', 'Clear List', 'Cancel', false, function(answer){
                if (answer === true) {
                    self.ignore.clear();
                    self.log('Ignored paths list cleared.');
                    self.terminal.action('clear');
                }
            });
         }); 

        self.terminal.listen('proceed', function() {            
            self.analyseScreen();
         });
    }

    analyseScreen(){
        var self = this;
        let topLevelFiles = this.library.list('.', 'file');
        let topLevelPathsClaimed = [];

        self.terminal.showMainWindow('analyse');
        self.terminal.progressBarShow();
        self.log("Film library path: '"+global.settings.libpath+"'", true);
        self.log("Begin analysis...", true);

        self.terminal.listen('proceed', function(response) { 
            if (self.actions.type.reviewDir.length || self.actions.type.reviewFile.length) self.reviewScreen();
            else if (self.actions.sequential.length) self.taskScreen();
            else self.finishScreen();
        });

        let filmInfo = this.library.list('.', 'directory').concat(this.library.list('.', 'video', false));
        self.progressTotal = filmInfo.length;

        filmInfo.forEach(function(info){
  
            if (!info.isDirectory && info.isPart && info.partNum > 1) return;

            let film = new self.modulesRequired.film(info, info.isDirectory ? null : topLevelFiles);

            if (!info.isDirectory) {
                topLevelPathsClaimed.push(info.path);

                film.files.all.forEach(function(file){
                    topLevelPathsClaimed.push(file.path);
                });
            }
            
            self.films.push(film);
        });

        setTimeout(() => {
            this.analyseFilm(0, function(){
                delete self.films;
        
                topLevelFiles.forEach(function(file){
                    if (topLevelPathsClaimed.indexOf(file.path) === -1) {
                        self.actions.type.deleteFile.push(file.path);
                        self.actions.sequential.push(['deleteFile', file.path]);
                    }
                });
                
                self.terminal.progressBarHide();
                self.log('', true);
    
                Object.keys(self.actions.type).forEach(function(key){
                    self.actions.total[key] = self.actions.type[key].length;
                });
    
                if (self.actions.sequential.length) {
                        self.log('-----------------------------------', true);
                        self.log('              Summary', true);
                        self.log('-----------------------------------', true);
                    
                        Object.keys(self.actions.total).forEach(function(key){
                            if (self.actions.total[key]) self.log(' '+(self.actionTitles.summary[key]+': ').padEnd(25)+self.actions.total[key], true);
                        });
            
                        self.log('-----------------------------------', true);       
                        self.log('', true);    
                        self.log('There are '+self.actions.sequential.length+' tasks to perform on '+self.filmCount+' films.', true);
                }   
                else self.log('There are no tasks to perform.', true);
            });        
        }, 300);

    }

    analyseFilm(index, callback) {
        var self = this;
        let film = this.films[index];
        if (!film) return callback()
        
        self.terminal.progressBarSet(Math.ceil(index / self.progressTotal * 100));

        film.analyse(function(response){
            switch (response.action) {
                case 'log':
                    self.log(response.message, true);
                    break;

                case 'warn':
                case 'error':
                    let key = (response.isDirectory) ? 'reviewDir' : 'reviewFile';
                    self.actions.type[key].push(response.path);
                    self.actions.sequential.push([key, response.path]);
                    self.filmCount++;

                    self.log(response.error+" \"/"+response.path+"\"", true, (response.action === 'error'));
                    self.analyseFilm(index + 1, callback);
                    break;

                case 'done':
                    Object.keys(response.actions).forEach(function(key){
                        response.actions[key].forEach(function(action){
                            self.actions.type[key].push(action);
                            self.actions.sequential.push([key, action]);
                        });
                    });

                    self.filmCount++;
                    self.analyseFilm(index + 1, callback);
                    break;
            }
        });
    }

    reviewScreen() {
        var self = this;
        let deletePaths = [];

        self.actions.type.reviewDir.concat(self.actions.type.reviewFile).forEach(function(path){
            deletePaths.push([false, path]);
        });

        self.terminal.showMainWindow('review', deletePaths);

        self.terminal.listen('proceed', function(response) {            
            self.reviewPaths(response);
            self.taskScreen();
        });
    }

    reviewPaths(ignoredPaths) {
        var self = this;

        ignoredPaths.forEach(function(path){
            
            let info = self.library.info(path[1]);
            let prevKey = info.isDirectory ? 'reviewDir' : 'reviewFile';
            let newKey = info.isDirectory ? (path[0] ? 'deleteDir' : 'ignoreDir') : (path[0] ? 'deleteFile' : 'ignoreFile');
            self.actions.type[newKey].push(path[1]);
            if (path[0]) self.log('User marked '+(info.isDirectory ? 'directory' : 'file')+' for deletion: '+path[1]);

            self.actions.sequential.forEach(function(action, index){
                if (action[0] == prevKey && action[1] == path[1]) self.actions.sequential[index][0] = newKey; 
            });
        });

        Object.keys(self.actions.total).forEach(function(key){
            self.actions.total[key] = self.actions.type[key].length;
        });

        self.actions.type.reviewDir = [];
        self.actions.type.reviewFile = [];
        self.actions.total.reviewDir = 0;
        self.actions.total.reviewFile = 0;
    }

    taskScreen() {
        var self = this;
        let taskList = [];

        self.actions.sequential.forEach(function(action){

            let task = [self.actionTitles.individual[action[0]]];

            switch (action[0]){
                case 'renameFile':
                case 'renameDir':
                    task.push('"/'+action[1][0]+'" -> "/'+action[1][1]+'"');
                    break;
             
                case 'createDir':
                case 'deleteDir':
                case 'deleteFile':
                case 'ignoreFile':
                case 'ignoreDir':
                    task.push('"/'+action[1]+'"');
                    break;

                case 'langFile':
                case 'nfoFile':
                case 'subtitle':
                    task.push('"/'+action[1][0]+'"'); 
                    break;
            }
            
            taskList.push(task);
        });

        self.terminal.showMainWindow('task', taskList);

        self.terminal.listen('export', function() {            
            self.terminal.prompt('Path to save file:', null, function(response){
                
                if (!response.submit) return self.terminal.promptHide();
               
                let path = response.answer.trim();
                let check = self.file.validateFilePath(path);
                if (!check.valid) return self.terminal.message(check.error);
                
                let body = '', info = [['Film library path', "\""+global.settings.libpath+"\""], ['Number of tasks', taskList.length]];
      
                taskList.forEach(function(line){
                    body += (line[0]+':').padEnd(10)+line[1]+'\n';
                });  
               
                let output = self.outputFile(path, 'Task List', info, body);
              
                if (output.success) {
                    self.terminal.promptHide();
                    self.terminal.message('Task list successfully exported.');
                    self.log('Task list exported: "'+path+'"');
                }
                else self.terminal.message('Error saving file: '+output.error);
            });
        });        
        
        self.terminal.listen('proceed', function(response) {    
            
            let msg = "Are you sure you want to perform these "+self.actions.sequential.length+" tasks?";
            if (self.actions.type.deleteDir.length || self.actions.type.deleteFile.length) msg += "\n\n {bold}{red-fg}Warning: Deleted files cannot be recovered!{/}";
            
            self.terminal.question(msg, 'Yes', 'No', true, function(answer){
                if (answer === true) self.actionScreen();
            });
        });
    }

    actionScreen() {
        var self = this;

        self.terminal.showMainWindow('action');
        self.terminal.progressBarShow();
        self.log('', true);
        self.log("Begin performing tasks...", true);

        setTimeout(() => {
            let i = 0, percent = 0, total = self.actions.sequential.length;
            
            ['createDir', 'renameDir', 'renameFile', 'deleteFile', 'deleteDir', 'ignoreDir', 'ignoreFile', 'nfoFile', 'langFile'].forEach(function(key){   
                if (!self.actions.type[key].length) return;
                self.log(self.actionTitles.progress[key]+'...', true);
                
                self.actions.type[key].forEach(function(detail){
                    i++;
    
                    if (Math.ceil(i / total * 100) > percent) {
                        percent++;
                        self.terminal.progressBarSet(percent);
                    }
    
                    self.fileTask(key, detail);
                });
            });  
            
            if (self.actions.type.subtitle.length) {
                self.downloadSubtitle(0, function(){
                    tasksDone();
                });
            }
            else tasksDone();
        }, 300);

        function tasksDone() {
            let msg = self.successCount+' tasks successfully completed'+(self.errorCount ? ' and '+self.errorCount+' errors.' : '.');
            self.log(msg, true);
            self.log('All done.', true);
            self.terminal.progressBarHide();
        }
     
        self.terminal.listen('proceed', function() {    
            self.finishScreen();
        });
    }

    fileTask(action, data) {
        var self = this;
        let response, line, title = self.actionTitles.individual[action];

        switch(action) {
            case 'createDir':
                line = '"/'+data+'"';
                response = self.library.mkdir(data);
                break;

            case 'renameDir':
            case 'renameFile':
                line = '"/'+data[0]+'" -> "/'+data[1]+'"';
                response = self.library.move(data[0], data[1]);
                break;

            case 'deleteFile':
            case 'deleteDir':
                line = '"/'+data+'"';
                response = self.library.delete(data);
                break;

            case 'ignoreDir':
            case 'ignoreFile':
                line = '"/'+data+'"';
                response = self.ignore.add(data);
                break;
                
            case 'nfoFile':
                line = '["'+data[1].title+'", '+data[1].year+', "'+data[1].imdbid+'", "'+data[1].language+'", "'+data[1].plot.substr(0,50)+'..."] -> "/'+data[0]+'"';
                response = self.saveNfo(data[0], data[1]);
                break;
                
            case 'langFile':
                line = '"'+data[1]+'" -> "/'+data[0]+'"';
                response = self.library.write(data[0], data[1]);
                break;
        }

        self.log((title+':').padEnd(10)+line);

        if (!response.success) self.log(response.error, true, true);
        else {
            self.successCount++;

            if (action === 'renameDir') {
                ['renameFile', 'deleteDir', 'deleteFile', 'ignoreDir', 'ignoreFile'].forEach(function(key){   
                    if (!self.actions.type[key].length) return;
                
                    self.actions.type[key].forEach(function(detail, index){
                        
                        let isStr = (typeof detail === 'string'), oldPath = isStr ? detail : detail[0];
                        
                        if (self.string.prefix(oldPath, data[0])) {
                            let newPath =data[1]+oldPath.substring(data[0].length, oldPath.length);
                            
                            if (isStr) self.actions.type[key][index] = newPath;
                            else self.actions.type[key][index][0] = newPath;
                        }
                    });
                });
            }
        }
    }

    saveNfo(path, data) {
        var self = this;
        let obj = {
            movie: {
                title: data.title,
                plot: data.plot,
                year: data.year.toString(),
                uniqueid: null
            }        
        };

        if (data.imdbid) {
            let imdbNode = {'@_type': 'imdb', '@_default': true, "#text": data.imdbid};
            
            if (data.tmdbid) {
                let tmdbNode = {'@_type': 'tmdb', "#text": data.tmdbid.toString()};
                obj.movie.uniqueid = [imdbNode, tmdbNode];
            }
            else obj.movie.uniqueid = imdbNode
        }
        else obj.movie.uniqueid = {'@_type': 'tmdb', '@_default': true, "#text": data.tmdbid};

        const options = {
            ignoreAttributes : false, 
            parseAttributeValue: true,
            tagValueProcessor: a => self.he.encode(a, {useNamedReferences: true}),
            attrValueProcessor: a => self.he.encode(a, {useNamedReferences: true}),
            format: true
        };

        let parser = new this.parser(options);
        let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>\n'+parser.parse(obj);
        return self.library.write(path, xml.trim());
    }

    downloadSubtitle(index,callback) {
        var self = this;

        let totalTasks = self.actions.sequential.length;
        let totalSubtitles = self.actions.type.subtitle.length;
        let i = totalTasks - totalSubtitles + index, percent = Math.ceil(i / totalTasks * 100);
        self.terminal.progressBarSet(percent);
  
        let data = self.actions.type.subtitle[index];

        self.log(self.actionTitles.progress.subtitle+' "'+data[0]+'"... ['+(index + 1)+'/'+totalSubtitles+']', true);
        self.log(self.actionTitles.individual.subtitle+': "'+data[1].url+'" -> "'+data[0]+'"');

        self.download.subtitle(data[1].url, data[0], data[1].encoding, function(response){
            if (!response.success) self.log(response.error, true, true);
            else self.successCount++;
            
            if (index < totalSubtitles - 1) self.downloadSubtitle(index + 1, callback);
            else callback();
        });
    }

    finishScreen() {
        var self = this;

        this.terminal.finishHide();
        this.terminal.showMainWindow('finish', [this.successCount, this.errorCount, this.actions.total, this.actionTitles.summary]);

        self.terminal.listen('export', function() {    
            self.terminal.prompt('Path to save file:', null, function(response){
                
                if (!response.submit) return self.terminal.promptHide();
               
                let path = response.answer.trim();
                let check = self.file.validateFilePath(path);
                if (!check.valid) return self.terminal.message(check.error);
                
                let body = self.file.read(self.logPath).data.trim();
                let info = [['Number of events', body.split('\n').length]];
                let output = self.outputFile(path, 'Event Log', info, body);
              
                if (output.success) {
                    self.terminal.promptHide();
                    self.terminal.message('Event log successfully exported.');
                    self.log('Event log exported: "'+path+'"');
                }
                else self.terminal.message('Error saving file: '+output.error);
            });      
        });
    }

    outputFile(path, title, arrInfo, body) {
        let mid = 37 - (title.length / 2);
        let str = ''.padEnd(74, '-')+'\n'+''.padEnd(23)+'Kodi Library Maintainer \n'+''.padEnd(74, '-')+'\n\n';
        str += ''.padEnd(mid)+title+'\n'.padEnd(mid+1)+''.padEnd(title.length, '-')+'\n\n';
        str += 'Date generated:'.padEnd(23)+(new Date().toString())+'\n';

        arrInfo.forEach(function(arr){
                str += (arr[0]+':').padEnd(23)+arr[1]+'\n';
        });

        str += '\n\n'+body.trim();     
        return this.file.write(path, str.trim());
    }

    log(message, terminal = false, error = false) {
        if (error) {
            this.errorCount++;
            message = '[Error] '+message; 
        }

        if (message.length) this.file.append(this.logPath, (new Date().toISOString()).padEnd(28)+message+'\n');
        
        if (terminal) {
            if (typeof this.terminal === 'object') this.terminal.log(message);
            else console.log(message);
        }
    }
}
module.exports = AppController;
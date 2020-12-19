/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
             Finish Window
------------------------------------------
*/
class FinishWindow {

    constructor() {

        var self = this;
        this.blessed = require('blessed');

        this.listeners = {
            'export': function(){}
        }

        this.contentContainer = this.blessed.box({
            left:0,
            right: 0,
            top: 0,
            bottom: 0,
            hidden: true,
        });

        this.heading = this.blessed.text({
            parent: this.contentContainer,
            left:"center",
            top: 1,
            height: 1,
            style: {
                bold: true,
                underline: true
            },
            content: "All Done!"
        }); 

        this.subheading = this.blessed.box({
            parent: this.contentContainer,
            top: 3,
            height: 2,
            left: 4,
            right: 4,
            align: 'center'        
        });     

        this.summaryContainer = this.blessed.box({
            parent: this.contentContainer,
            top: 5,
            height: 14,
            left: "center",
            width: 32,
            border: {
                type: 'line'
            }
        });   

        this.summaryHeading = this.blessed.box({
            parent: this.summaryContainer,
            top: 0,
            height: 1,
            left: 0,
            right: 0,
            align: 'center',
            style: {
                bold: true,
            },
            content: 'Summary'
        });

        this.summaryLine = this.blessed.line({
            parent: this.summaryContainer,
            top: 1,
            left: 0,
            right: 0,
            orientation: "horizontal",
        });

        this.buttonExport = this.blessed.button({
            parent: this.contentContainer,
            top: 20,
            left: "center",
            width: 31,
            height: 3,
            align: "center",
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                border: {
                    fg: 'white'
                },  
                focus: {
                    fg: 'light-green',
                    bold: true,    
                    border: {
                        fg: 'light-green',
                    }
                }
            },
            content: 'Export Event Log',
        });

        this.buttonExport.key(['return'], function(ch, key){
            self.listeners.export();
        }); 

        this.buttonExit = this.blessed.button({
            parent: this.contentContainer,
            bottom: 0,
            left: "center",
            width: 25,
            height: 3,
            align: "center",
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                border: {
                    fg: 'white'
                },
                focus: {
                    fg: 'light-green',
                    bold: true,    
                    border: {
                        fg: 'light-green',
                    }
                }
            },
            content: 'Exit',
        });

        this.buttonExit.key('return', function(){  
            return process.exit(0);
        });   

        this.initialFocus = this.buttonExit;
    }

    before(data) {
        var self = this;
        let msg;

        if (data[0] || data[1]) msg = data[0]+' tasks successfully completed'+(data[1] ? ' and '+data[1]+' errors.' : '.');
        else msg = 'There were no tasks to perform.';

        if (!data[1]) msg += '  Your film library is fully maintained.';
        this.subheading.content = msg;

        delete data[3].reviewDir;
        delete data[3].reviewFile;

        Object.keys(data[3]).forEach(function(key, index){

            let summaryLine = self.blessed.text({
                top: (index + 2),
                left: 1,
                height: 1,
                width: 28,
                content: (data[3][key]+':').padEnd(23)+data[2][key]
            });

            self.summaryContainer.append(summaryLine);
        });
    }
}
module.exports = FinishWindow;
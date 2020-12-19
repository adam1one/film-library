/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
          Ignore List Window
------------------------------------------

Review/clear ignored paths
*/
class IgnoreWindow {

    constructor() {

        var self = this;
        this.blessed = require('blessed');

        this.listeners = {
            'clear': function(){}
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
            content: "Review Ignored Paths"
        }); 

        this.pathList = this.blessed.list({
            parent: this.contentContainer,
            top: 3,
            bottom: 6,
            left: 4,
            right: 4,
            align: "left",
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                border: {
                    fg: 'white'
                },
                focus: {
                    border: {
                        fg: "green"
                    },
                    header: {
                        fg: "green"
                    }
                },
                header: {
                    bold: true,
                },
            },
            keys: true,
            selectedBg: 'light-black',
            scrollable: true,
        });

        this.buttonClear = this.blessed.button({
            parent: this.contentContainer,
            content: 'Clear List',
            bottom: 3,
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
        });

        this.buttonClear.key(['return'], function(ch, key){
            if (self.pathList.children.length) self.listeners.clear();
        }); 

        this.proceedButtonText = 'Analyse';
    }

    before(ignoredPaths) {
        var self = this;

        ignoredPaths.forEach(function(path){
            self.pathList.add(path);
        });
    }

    clear() {
        this.pathList.clearItems();
        this.contentContainer.screen.render();
    }
}
module.exports = IgnoreWindow;
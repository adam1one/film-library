/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
             Task Window
------------------------------------------

List all tasks (with limit) and option to export
*/
class TaskWindow {

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
            left: "center",
            top: 1,
            height: 1,
            style: {
                bold: true,
                underline: true
            },
            content: "Review Tasks"
        });  

        this.subheading = this.blessed.text({
            parent: this.contentContainer,
            left: "center",
            top: 3,
        });
        
        this.table = this.blessed.listtable({
            parent: this.contentContainer,
            top: 5,
            bottom: 8,
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
            noCellBorders: true,
            selectedBg: 'light-black',
            keys: true,
            scrollable: true,
        });

        this.buttonExport = this.blessed.button({
            parent: this.contentContainer,
            content: 'Export Task List',
            left: "center",
            width: 31,
            height: 3,
            bottom: 4,
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
            }
        });
        
        this.buttonExport.key(['return'], function(ch, key){
            self.listeners.export();
        }); 

        this.proceedButtonText = 'Perform Tasks';
        this.initialFocus = this.table;
    }
   
    before(taskList) {
        let num = taskList.length, max = 1000;
        let last = (Math.min(num, max));

        this.subheading.content = "There are "+num+" tasks to perform.";
        
        let tableData = [['#', 'Action', 'Path']];

        for (var i = 1; i <= last; i++) {
            tableData.push([i.toString(), taskList[i - 1][0], taskList[i - 1][1]]);
        }

        if (num > max) tableData.push([' ... '+(num - max)+' more items']);

        this.table.setData(tableData);
    }
}
module.exports = TaskWindow;
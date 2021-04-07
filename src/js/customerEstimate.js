const ipcRenderer = require('electron').ipcRenderer;
const moment = require('moment');

const path = require('path');
const appPath = require('electron').remote.app.getAppPath();
const commonModule = require(path.join(appPath, 'src', 'modules', 'commonModule.js'));
const usersModule = require(path.join(appPath, 'src', 'modules', 'usersModule.js'));
const inventoryModule = require(path.join(appPath, 'src', 'modules', 'inventoryModule.js'));

var itemID;
var month;
var itemsOptions = {};
var stockValue = 0;
$(document).ready(() => {

    // Load side menu
    commonModule.loadSideMenu('customerEstimate.html', (err, html) => {
        $('#menuHolder').html(html);
    });

    if (usersModule.checkPermission('viewInventoryTransactions')) {
        console.log('Permission granted: viewInventoryTransactions');
        mainStuff();
    }
});

function mainStuff() {

    inventoryModule.getItems((err, result) => {
        if (err) {
            console.log(err);
            $('#contentDiv').html('Error loading data');
        } else {
            let groups, subgroups, items;
            [groups, subgroups, items] = result;
            for (let groupKey in groups) {
                let groupID = groups[groupKey].id;
                let groupName = groups[groupKey].name;
                for (let subgroupKey in subgroups) {
                    if (subgroups[subgroupKey].groupID == groupID) {
                        let subgroupID = subgroups[subgroupKey].id;
                        let subgroupName = subgroups[subgroupKey].name;
                        for (let itemKey in items) {
                            if (items[itemKey].subgroupID == subgroupID) {
                                itemsOptions[items[itemKey].id] = `${groupName} - ${subgroupName} - ${items[itemKey].name}`;
                            }
                        }
                    }
                }
            }
        }
    });

    var itemName = "test";
    var receipt = true;
    var username = 'admin';
    var selectedItemID = 0;
    let resultHTML = `<div class="form-group row text-center" style="width:100%;">
                            <div class="text-center col-md-12 col-lg-12"><b>New Inventory Receipt</b></div>
                        </div>

                        <div class="form-group row" style="width:100%;">
                            <div class="col-md-3 col-lg-3 text-right">
                                <label class="col-form-label">Date</label>
                            </div>
                            <div class="col-md-9 col-lg-9">
                                <input type="text" id="date" class="form-control" />
                            </div>
                        </div>

                        <div class="form-group row" style="width:100%;">
                            <div class="col-md-3 col-lg-3 text-right">
                                <label class="col-form-label">Item</label>
                            </div>
                            <div class="col-md-9 col-lg-9">
                                <input type="text" id="itemName" class="form-control" />
                                <input type="hidden" id="itemID" />
                            </div>
                        </div>
                    
                        <div class="form-group row" style="width:100%;">
                                <div class="col-md-3 col-lg-3 text-right"></div>
                                <div class="col-md-9 col-lg-9" id="itemSuggestion">
                                </div>
                        </div>

                
                        <div class="form-group row" style="width:100%;">
                            <div class="col-md-3 col-lg-3 text-right">
                                <label class="col-form-label">`+ (receipt ? 'Receipt' : 'Issue') + ` Qty</label>
                            </div>
                            <div class="col-md-9 col-lg-9">
                            <div class="input-group mb-2">
                                <input type="number" class="form-control" id="receipts"  placeholder="">
                                <div class="input-group-prepend">
                                <div class="input-group-text" id="instock_text">0 instock</div>
                          </div>
                          </div>
                            </div>
                        </div>



                        <div class="form-group row" style="width:100%;">
                            <div class="col-md-3 col-lg-3 text-right">
                                <label class="col-form-label">Unit Price</label>
                            </div>
                            <div class="col-md-9 col-lg-9">
                                <input type="number" id="unitValue" class="form-control" />
                            </div>
                        </div>
                       
                        <div class="form-group row" style="width:100%;">
                            <div class="col-md-3 col-lg-3 text-right">
                                <label class="col-form-label">Customer Name</label>
                            </div>
                            <div class="col-md-9 col-lg-9">
                                <input type="text" id="username" class="form-control"  value="" />
                            </div>
                        </div>
                        <div class="container text-center" style="width:100%">
                            <button class="btn btn-outline-secondary" id="editGroup" onclick="newTransaction()">
                                <i class="fa fa-save"></i> Add To Estimate</button>
                            <button class="btn btn-outline-secondary" id="cancel" onclick="cancelDialog()">
                                <i class="fa fa-close"></i> Cancel</button>
                        </div>
                        
                        <br/>
                        <br/>
                        <br/>

                        <table class="table table-sm table-light table-hover">
                        <thead>
                            <tr>
                                <th>sNo</th>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody id='temp_bill_inner'>

                        </tbody>
                        </table>

                        <div class="row">
                        <div class="col-sm-4 offset-8">
                        <table class="table table-sm table-light table-hover">
                        <tr>
                        <td align="center"><button id="pdfBillbutton">Take Print</button><button id="btnGenEstimateBill" onclick="moveToEntries()"> Close Transaction </button></td>
                        </tr>
                        </table>
                        </div>
                        </div>

                        `;
    $('#contentDiv').html(resultHTML);

    $('#itemName').keyup(() => {
        $('#itemID').val('');
        searchItem($('#itemName').val());
    })

    $('#date').datetimepicker({
        timepicker: false,
        format: 'd-m-Y'
    });

     // PDF button
     $('#pdfBillbutton').on('click', (e)=>{
        ipcRenderer.send('open-new-window', 'customerEstimatePdf.html', []);
    })



    getItemInTempBill();

}


function searchItem(char) {
    let results = {};
    for (let i in itemsOptions) {
        let item = itemsOptions[i].toLowerCase();
        if (item.indexOf(char) != -1) {
            results[i] = itemsOptions[i];
        }
    }

    let finalResult = '';
    for (let i in results) {
        finalResult += `<a href="#itemName" onclick="selectItem(${i})">${results[i]}</a><br />`;
    }
    $('#itemSuggestion').html(finalResult);
}


function selectItem(itemID) {
    for (let i in itemsOptions) {
        if (i == itemID) {
            $('#itemName').val(itemsOptions[i]);
            $('#itemID').val(i);
            selectedItemID = i;
            break;
        }
    }
    $('#itemSuggestion').html('');
    isStockAvaiable(selectedItemID);
}
function isStockAvaiable(itemId) {
    inventoryModule.getItemInStock(selectedItemID).then(result => {
        if (result) {
            if (result[0].stock == null) {
                $('#instock_text').html(`0 instock`)
                $('#instock_text').css({ 'color': 'red','font-weight': 'bold'})
            } else {
                stockValue = result[0].stock;
                $('#instock_text').html(`${result[0].stock} instock`)
            }
        }
    }).catch(error => {
        alert("some thing went wrong" + error);
    })
}

function resetData() {
    selectedItemID = -100;
    $('#date').val("");
    $('#itemName').val("");
    $('#receipts').val("");
    $('#unitValue').val("");
    $('#username').val("");
}


function resetNeccesoryData() {
    selectedItemID = -100;
    $('#itemName').val("");
    $('#receipts').val("");
    $('#unitValue').val("");
    
}

function cancelDialog() {
    resetData();

}

function removeFromEstimate(id) {
    inventoryModule.removeItemFromEstimateBill(id).
        then(result => {
            if (result) {
                getItemInTempBill();
            }
        }).catch(error => {
            alert('Some Error Occured ' + error);
        })

}

function getItemInTempBill() {

    $('#temp_bill_inner').html("");

    inventoryModule.getTempBillItems().then(result => {
        let count = 0;
        let grandTotal = 0;

        if (result.length > 0) {
            $('#btnGenEstimateBill').show();
        } else {
            $('#btnGenEstimateBill').hide();
        }

        result.map(e => {
            count++;
            var tableRow = `<tr>
                <td>${count}</td>
                <td>${e.itemname}</td>
                <td>${Math.abs(e.receipts)}</td>
                <td>${e.unitValue}</td>
                <td>${Math.abs(e.receipts) * e.unitValue}</td>
                <td><button onclick="removeFromEstimate('${e.id}')">Remove Item</button</td>
            </tr>`
            grandTotal = grandTotal + Math.abs(e.receipts) * e.unitValue
            $('#temp_bill_inner').append(tableRow);
        })

    }).catch(error => {
        alert(error);
    })

}

function moveToEntries(){
    
    inventoryModule.getTempBillItems().then(result => {
        let count = 0;
        let grandTotal = 0;

        result.map(e => {
           
            let data = {
                itemID: e.itemID,
                datetime: e.datetime,
                receipts:e.receipts,
                unitValue:e.unitValue,
                comments:e.comments,
                username:e.username
            };
            console.log(data);
            inventoryModule.newTransaction(data, (err, result)=>{
                if(err) {
                    $('#contentDiv').html('Could not save data!');
                    console.log(err);
                } else {
                   //delete temp record 
                   inventoryModule.deleteAllTempEstimateBill();
                }
            })

        })

        $('#temp_bill_inner').html("");

    }).catch(error => {
        alert(error);
    })

}

function newTransaction() {
    try {
        let date = commonModule.getValidValue('date');
        let receipts = commonModule.getValidValue('receipts');
        let username = $('#username').val();
        let comments = "Sales to "+username;
        date = moment(date, "DD-MM-YYYY kk:mm");
        if (!date || !receipts) {
            return false;
        }
        let unitValue = 0;
        if (receipts) {
            receipts = receipts * -1;
            unitValue = commonModule.getValidValue('unitValue');
            if (!unitValue)
                return false;
        }
        let data = {
            itemID: selectedItemID,
            datetime: date.unix(),
            receipts,
            unitValue,
            comments,
            username
        };

        inventoryModule.newBillAddItem(data, (err, result) => {
            if (err) {
                $('#contentDiv').html('Could not save data!');
                console.log(err);
            } else {
                getItemInTempBill();
                resetNeccesoryData();
            }
        })

    } catch (error) {
        alert(error);
    }


}


window.onerror = function (error, url, line) {
    console.log(error);
};

$(document).on("click", "tr.itemRow", function (e) {
    let itemID = commonModule.getRowID(e);
    ipcRenderer.send('redirect-window', 'inventoryTransactionDetails.html', [`id=${itemID}`]);
});
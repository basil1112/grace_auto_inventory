const ipcRenderer = require('electron').ipcRenderer;
const moment = require('moment');

const path = require('path');
const appPath = require('electron').remote.app.getAppPath();
const commonModule = require(path.join(appPath, 'src', 'modules', 'commonModule.js'));
const usersModule = require(path.join(appPath, 'src', 'modules', 'usersModule.js'));
const inventoryModule = require(path.join(appPath, 'src', 'modules', 'inventoryModule.js'));

var itemID;
var month;

$(document).ready(() => {
        mainRender();
});


function mainRender(){

    var resultHTML = `<div class="text-center printButton">
    <button class="btn btn-outline-primary" onclick="commonModule.exportPDF('transaction_report')">
       <i class="fa fa-file-pdf-o"></i> Export PDF
   </button>
       <button class="btn btn-outline-primary" onclick="commonModule.printPage()">
           <i class="fa fa-print"></i> Print
       </button>
   </div>
       <h4>Grace Auto Electricals</h4>
       <p>Chalakudy, Near CSI Church <br> +919846556877</p>
   <br />
   
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
   <div id="grandTotTble" class="table table-sm table-light table-hover">
   
   </div>
   `;

   $('#contentDiv').html(resultHTML);
 
   getItemInTempBill();

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
            </tr>`
            grandTotal = grandTotal + Math.abs(e.receipts) * e.unitValue
            $('#temp_bill_inner').append(tableRow);
            
            var lastRow = `<div class="row">
            <div class="col-sm-4 offset-8">
            <table class="table table-sm table-light table-hover">
            <tr>
            <td align="right"><p>GrandTotal : </p><h5>${grandTotal}</h5></td>
            </tr>
            </table>
            </div>
            </div>`

            $('#grandTotTble').html(lastRow);

        })

    }).catch(error => {
        alert(error);
    })

}


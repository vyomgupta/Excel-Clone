let operands = new Stack();
let operators = new Stack();
let formulaBar = document.querySelector('.formula_input');

function isAlphaNumeric(str) {
    let code, i;
    for (i = 0; i < str.length; i++) {
        code = str.charCodeAt(i);
        if (!(code >= 48 && code <= 57) && // numeric (0-9)
            !(code >= 65 && code <= 90) && // upper alpha (A-Z)
            !(code >= 97 && code <= 122)) { // lower alpha (a-z)
            return false;
        }
    }
    return true;
};

function getCellData(v) {
    let i = v.search(/\d/); //returning the index of first digit
    let col = v.substring(0, i);
    let row = v.substring(i, v.length);

    //converting into  col nos
    if (col.length > 1) {
        let result = 0;
        for (let i = 0; i < col.length; i++) {
            result *= 26;
            result += col.charCodeAt(i) - 65 + 1;
        }
        col = result;
    } else {
        col = v.charCodeAt(col) - 65 + 1;
    }
    let cell = document.querySelector(`.cell[row = "${row}"][col = "${col}"]`)
    return cell.value.length == 0 ? ["0",row, col] : [cell.value, row, col];
}

function precedence(op) {
    if (op === '+' || op === '-') {
        return 1;
    } else if (op === '/' || op === '*') {
        return 2;
    }
}

function operation(v1, v2, op) {
    if (op === '+') {
        return v1 + v2;
    } else if (op === '-') {
        return v1 - v2;
    } else if (op === '*') {
        return v1 * v2;
    } else {
        return v1 * 1.0 / v2;
    }
}

function isNumeric(num) {
    return !isNaN(num)
}

function evaluateExpression(values) {
    //values = "A12 + B12 + C12"
    values = values.split(" ");
    let expression = "";
    for (let v of values) {

        //for operators and brackets
        if (!isAlphaNumeric(v)) {
            expression += v + " ";
        }
        //for numbers like 100, 20
        else if (isNumeric(v)) {
            expression += v + " ";
        }
        //for cells like A3 , B12
        else {
            let [n,,_] = getCellData(v);
            expression += n + " ";
        }
    }

    if(expression.trim() === "")return;
    s = expression.trim();  // s = "10 + 12 / 13"
    s = s.split(" ");
    for (let v of s) {

        if (!isNumeric(v)) {
            if (v == '(') {
                operators.push(v);
            } else if (v == ')') {
                while (operators.peek() != '(') {
                    let op = operators.pop();
                    let v2 = operands.pop();
                    let v1 = operands.pop();
                    let val = operation(v1, v2, op);
                    operands.push(val);
                }

                operators.pop();
            } else if (v == '+' || v == '-' || v == '*' || v == '/') {
                while (operators.size() > 0 && operators.peek() != '(' && precedence(v) <= precedence(operators.peek())) {
                    let op = operators.pop();
                    let v2 = operands.pop();
                    let v1 = operands.pop();
                    let val = operation(v1, v2, op);
                    operands.push(val);
                }
                operators.push(v);
            }
        } else {
            operands.push(Number.parseInt(v));
        }
    }
    while (operators.size() > 0) {
        let op = operators.pop();
        let v2 = operands.pop();
        let v1 = operands.pop();
        let val = operation(v1, v2, op);
        operands.push(val);
    }
    return operands.pop();
}

function setChildren(cellName, formula){
    formulaTokens = formula.split(" ");
    for(let f of formulaTokens){
        if (!isAlphaNumeric(f)) {
        }
        //for numbers like 100, 20
        else if (isNumeric(f)) {
        }
        //for cells like A3 , B12
        else {
            let cell = document.querySelector(`.cell[name = '${f}']`);
            let row = cell.getAttribute('row');
            let col = cell.getAttribute('col');
            let key = row + "-" + col;
            let arr = [cellName];

            if (sheets[selectedSheet][key] == undefined) {
                sheets[selectedSheet][key] = {};
                sheets[selectedSheet][key] = {
                    ...DefaultProperties,
                    children: [...arr]
                };
            } else {
                sheets[selectedSheet][key] = {
                    ...sheets[selectedSheet][key],
                    children: [...sheets[selectedSheet][key].children, ...arr]
                };
            }
        }
    }
}


function checkCycle(cellName, formulaTokens) {
    console.log("running");
    let cell = document.querySelector(`.cell[name = '${cellName}']`);
    let row = cell.getAttribute('row');
    let col = cell.getAttribute('col');
    let key = row + "-" + col;
    let children = sheets[selectedSheet][key] == undefined ? [] : sheets[selectedSheet][key].children;
    console.log(children,cellName,formulaTokens)
    for (let child of children) {
        for (let f of formulaTokens) {

            //for opeartors and brackets
            if (!isAlphaNumeric(f)) {
            }
            //for numbers like 100, 20
            else if (isNumeric(f)) {
            }
            //for cells like A3 , B12
            else {
                if(child === f){
                    return true;
                }
            }
        }
        if(checkCycle(child, formulaTokens)){
            return true;
        };
    }
    return false;  //cycle not found
}



function formulaChangeHandler(values) {
    let selectedCell = document.querySelector('.cell.selected');
    let name = selectedCell.getAttribute('name');  ///gives A12 / B3
//values.includes(name) = when B1 the parent of B1
    if(values.includes(name) || checkCycle(name, [...values.split(" ")])){
        alert("cycle detected");
        return true;
    }

    let val = evaluateExpression(values);
    updateSheetData('text', val);
    selectedCell.value = val
    setChildren(name, values); //if formula entered cell  =  b + c then cell will be the children of b and c
    return false;
}

formulaBar.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        let values = e.target.value;
        let isCyclePresent = formulaChangeHandler(values);
        if(!isCyclePresent){
            let selectedCell = document.querySelector('.cell.selected');
            updateSheetData("formula", values);
            updateChildren(selectedCell);
            loadCurrentSheetData(selectedSheet);
        }
    }
})

//updating the value of children as the value of parent updated
function updateChildren(cell) {
    let r = cell.getAttribute('row')
    let c = cell.getAttribute('col')
    let key = r + "-" + c;
    let children = sheets[selectedSheet][key] == undefined ? [] : sheets[selectedSheet][key].children;

    for (let child of children) {
        let childCell = document.querySelector(`.cell[name = '${child}']`)
        let childRow = childCell.getAttribute('row')
        let childCol = childCell.getAttribute('col')
        let childKey = childRow + "-" + childCol;

        // get formula of children
        let childFormula = sheets[selectedSheet][childKey].formula;
        let newValue = evaluateExpression(childFormula); //find value
        sheets[selectedSheet][childKey] = {
            ...sheets[selectedSheet][childKey],
            text: newValue
        }
        updateChildren(childCell);
    }
}
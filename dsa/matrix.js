const fs = require('fs');

//function to read a sparse matrix from a file
function readSparseMatrix(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const lines = data.split('\n').map(line => line.trim()).filter(line => line !== '');

        let rows, cols;
        let matrixEntries = [];

        lines.forEach((line, index) => {
            if (index === 0) {
                if (line.startsWith('rows=')) {
                    rows = parseInt(line.split('=')[1]);
                } else {
                    throw new Error("Input file has wrong format");
                }
            } else if (index === 1) {
                if (line.startsWith('cols=')) {
                    cols = parseInt(line.split('=')[1]);
                } else {
                    throw new Error("Input file has wrong format");
                }
            } else {
                const entry = parseEntry(line);
                matrixEntries.push(entry);
            }
        });

        return { rows, cols, matrixEntries };
    } catch (error) {
        console.error("Error reading matrix file:", error.message);
        throw error;
    }
}

// function to change an entry like (0, 381, -694)
function parseEntry(entry) {
    entry = entry.trim();
    if (!entry.startsWith('(') || !entry.endsWith(')')) {
        throw new Error("Input file has wrong format");
    }

    entry = entry.substring(1, entry.length - 1);
    const parts = entry.split(',');
    if (parts.length !== 3) {
        throw new Error("Input file has wrong format");
    }

    const row = parseInt(parts[0].trim());
    const col = parseInt(parts[1].trim());
    const value = parseInt(parts[2].trim());

    if (isNaN(row) || isNaN(col) || isNaN(value)) {
        throw new Error("Input file has wrong format");
    }

    return { row, col, value };
}

//function to create a sparse matrix structure
function createSparseMatrix(rows, cols, entries) {
    let matrix = new Map();

    entries.forEach(({ row, col, value }) => {
        if (!matrix.has(row)) {
            matrix.set(row, new Map());
        }
        matrix.get(row).set(col, value);
    });

    return { rows, cols, matrix };
}

//function to get value at (row, col) from the matrix
function getValue(matrix, row, col) {
    if (matrix.has(row) && matrix.get(row).has(col)) {
        return matrix.get(row).get(col);
    }
    return 0;
}

// function to set value at (row, col) in the matrix
function setValue(matrix, row, col, value) {
    if (value === 0) return;
    if (!matrix.has(row)) {
        matrix.set(row, new Map());
    }
    matrix.get(row).set(col, value);
}

// Matrix addition
function addMatrices(matrixA, matrixB) {
    if (matrixA.rows !== matrixB.rows || matrixA.cols !== matrixB.cols) {
        throw new Error('Matrices dimensions must match for addition');
    }

    let resultMatrix = new Map();

    // Add values from matrix1
    matrixA.matrix.forEach((rowMap, row) => {
        rowMap.forEach((value, col) => {
            setValue(resultMatrix, row, col, value);
        });
    });

    // Add values from matrix2
    matrixB.matrix.forEach((rowMap, row) => {
        rowMap.forEach((value, col) => {
            const currentValue = getValue(resultMatrix, row, col);
            setValue(resultMatrix, row, col, currentValue + value);
        });
    });

    return { rows: matrixA.rows, cols: matrixA.cols, matrix: resultMatrix };
}

// Matrix subtraction
function subtractMatrices(matrixA, matrixB) {
    if (matrixA.rows !== matrixB.rows || matrixA.cols !== matrixB.cols) {
        throw new Error('Matrices dimensions must match for subtraction');
    }

    let resultMatrix = new Map();

    // Subtract values from matrix1
    matrixA.matrix.forEach((rowMap, row) => {
        rowMap.forEach((value, col) => {
            setValue(resultMatrix, row, col, value);
        });
    });

    // Subtract values from matrix2
    matrixB.matrix.forEach((rowMap, row) => {
        rowMap.forEach((value, col) => {
            const currentValue = getValue(resultMatrix, row, col);
            setValue(resultMatrix, row, col, currentValue - value);
        });
    });

    return { rows: matrixA.rows, cols: matrixA.cols, matrix: resultMatrix };
}

// Matrix multiplication
function multiplyMatrices(matrixA, matrixB) {
    if (matrixA.cols !== matrixB.rows) {
        throw new Error('Invalid matrix dimensions for multiplication');
    }

    let resultMatrix = new Map();

    matrixA.matrix.forEach((rowMapA, rowA) => {
        rowMapA.forEach((valueA, colA) => {
            if (matrixB.matrix.has(colA)) {
                matrixB.matrix.get(colA).forEach((valueB, colB) => {
                    const currentValue = getValue(resultMatrix, rowA, colB);
                    setValue(resultMatrix, rowA, colB, currentValue + valueA * valueB);
                });
            }
        });
    });

    return { rows: matrixA.rows, cols: matrixB.cols, matrix: resultMatrix };
}

// function to display a sparse matrix
function matrixToString(matrixObj) {
    let result = `Rows: ${matrixObj.rows}, Cols: ${matrixObj.cols}\n`;
    matrixObj.matrix.forEach((rowMap, row) => {
        rowMap.forEach((value, col) => {
            result += `(${row}, ${col}, ${value})\n`;
        });
    });
    return result;
}

// --------------------Function to write the number of columns and rows of the resulting matrix--------------------------------------------//
function writeOutput(outputFilePath, resultMatrix) {
    const resultMatrixData = `rows: ${resultMatrix.rows}\ncols: ${resultMatrix.cols}`
    fs.writeFileSync(outputFilePath, resultMatrixData);
  }


// Main function to run the application with user inputs
function main() {
    try {
        // the user inputs
        const operation = 'add';  // Choose between 'add', 'subtract', 'multiply'

        const matrix1Path = 'sample_input_for_students/easy_sample_02_1.txt';
        const matrix2Path = 'sample_input_for_students/easy_sample_02_2.txt';

        const matrix1Data = readSparseMatrix(matrix1Path);
        const matrix2Data = readSparseMatrix(matrix2Path);

        const matrix1 = createSparseMatrix(matrix1Data.rows, matrix1Data.cols, matrix1Data.matrixEntries);
        const matrix2 = createSparseMatrix(matrix2Data.rows, matrix2Data.cols, matrix2Data.matrixEntries);

        let result;
        if (operation === 'add') {
            result = addMatrices(matrix1, matrix2);
        } else if (operation === 'subtract') {
            result = subtractMatrices(matrix1, matrix2);
        } else if (operation === 'multiply') {
            result = multiplyMatrices(matrix1, matrix2);
        } else {
            throw new Error("Invalid operation");
        }
        const file1Name = matrix1Path.split('/')[1];
        const file2Name = matrix2Path.split('/')[2];
        const outputFilePath = './SampleOutPutResults/' + file1Name  +  file2Name + '_results.txt'

        writeOutput(outputFilePath, result);

        console.log("Resulting Matrix:");
        console.log(matrixToString(result));

    } catch (error) {
        console.error(error.message);
    }
}

main();


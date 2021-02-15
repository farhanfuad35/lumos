const dictionaryDatabaseLink = 'https://raw.githubusercontent.com/MinhasKamal/BengaliDictionary/master/BengaliDictionary.json';
const RADIX = 256;
const PRIME = 908209935089;  // 12 digit
const ROOT_PRIME = 95300
// var DICTIONARY_SIZE

// Classes

// Only for debug purpose
class Debug{
    duplicateWords = 0
    maximumCollisionInFirstLayer(hashTable){
        var mx = -1;
        for(var i=0; i<hashTable.length; i++){
            mx = Math.max(mx, hashTable[i].length);
        }

        return mx;
    }

    statistics(hashTable){
        console.log('Maximum number of collisions in a particular slot: ' + 
            this.maximumCollisionInFirstLayer(hashTable));
    }
}

var debug = new Debug();

class Dictionary{
    database
    numberOfWords
};

class Hashing{
    hashTable;
    hashTableKeys;
    primaryHashA = null;
    primaryHashB = null;

    initializeHashTable(){
        this.hashTable = new Array(dictionary.numberOfWords);
        for(var i=0; i<dictionary.numberOfWords; i++){
            this.hashTable[i] = [];
        }
        this.hashTableKeys = new Array(dictionary.numberOfWords);
    }


    convertFromWordToKey(word){
        // Lower case word expected
        var val = 0;
        var a = Math.floor(Math.random() * (PRIME - 1) ) + 1;
        var b = Math.floor(Math.random() * PRIME);

        // Check if primaryHash values are already defined. Defined means would mean
        // the hash has already been implemented and user is searching. 
        // Otherwise hashTable is just being generated and this function
        // is called by generatePrimaryHash(), not calculatePrimaryHash()
        if(this.primaryHashA == null || this.primaryHashB == null){
            this.primaryHashA = a;
            this.primaryHashB = b;
        }
        else{
            a = this.primaryHashA;
            b = this.primaryHashB;
        }

        /* Theoretically, we weren't supposed to take reminder of a prime
            inside the for loop. But as it happens, just a 7 characters Unicode
            word may map to approximately 10^17 (256^7) size integer. In JS, Number
            type has max limit of a decimal number of approximately 16 digits.
            Thus we cannot let a word be mapped to number more than that. As a 
            workaround, we have taken the remainder of a prime which is of 12 digits
            in decimal, so that the multiplication val*RADIX never crosses
            a number that is more than 16 digits.

            One complication of this is that there might be cases where two 'different'
            words mapping to the 'same' numerical key value even though theoretically
            every (a, b) should have generated a unique key pair (r, s). We can show
            that this possibility is very very low since in practice total number of words
            is only around ~17000 and the chance that two different words map to the
            same integer k (mod PRIME) is 17000/PRIME = 17000/908209935089 ~ 1.8e-6%

            In secodary hashing, even with this very low probability if it is
            found that two keys map to the same integer, it is assumed that they
            are just the anomaly caused by this modulo operation, not because they
            are the same words since we can assume that the given dictionary has
            the words all unique.
        */

        for(var i=0; i<word.length; i++){
            val = ( (val*RADIX) % PRIME + word.charCodeAt(i) ) % PRIME;
        }

        const aB = BigInt(a);
        const valB = BigInt(val);
        const primeB = BigInt(PRIME);
        const bB = BigInt(b);
        const out = (aB*valB + bB) % primeB;

        return Number(out);
    }


    calculatePrimaryHash(word){
        return this.convertFromWordToKey(word) % dictionary.numberOfWords;
    }

    calculateSecondaryHash(a, b, m, word){
        const aB = BigInt(a);
        const keyB = BigInt(this.convertFromWordToKey(word));

        // DEBUG
        // console.log(word);
        // console.log('Calculated Key: ' + this.convertFromWordToKey(word));

        return ( ( Number((aB*keyB)%BigInt(PRIME)) + b ) % PRIME ) % m;
    }

    collisionDetected(a, b, m, initialArray, finalArray){

        // DEBUG

        for(var i=0; i<initialArray.length; i++){
            var secondaryHashValue = this.calculateSecondaryHash(a, b, m, dictionary.database[initialArray[i]].en);

            // DEBUG
            // console.log('Calculated SH: ' + secondaryHashValue);

            if(finalArray[secondaryHashValue]==null){
                finalArray[secondaryHashValue] = initialArray[i];
            }
            else{
                // DEBUG
                // console.log('Collision Detected for a = ' + a + ' & b = ' + b );

                return true;
            }
        }

        // DEBUG
        // console.log('No Collision Yeey!');

        return false;
    }

    generateSecondaryHash(returnArray, primaryHashValue){
        // returnArray refers to the hashtable[i] where finally
        // the secondary hashtable should be implemented. Note
        // that returnArray is currently the size n_i not (n_i)^2

        var finalArrayLength = returnArray.length*returnArray.length;
        const initialArrayLength = returnArray.length;
        var finalArray = new Array(finalArrayLength).fill(null);
        
        // Make a copy of the returnArray that currently holds the
        // indices who map to the same primaryHashValue. This is to
        // avoid working with the final returnArray.
        var initialArray = Array.from(returnArray);

        // Try Random a, b and see if collision occurs
        var a = Math.floor(Math.random() * (PRIME - 1) ) + 1;
        var b = Math.floor(Math.random() * PRIME);

        // console.log('Debug: Going in');

        // DEBUG
        var itr = 0;

        while(this.collisionDetected(a, b, finalArrayLength, initialArray, finalArray)){
            // DEBUG
            itr = itr+1;
            if(itr>100) {
                console.log('a = ' + a + ", b = " + b);
                console.log('Final Length: ' + finalArrayLength);
                console.log('The array: ');
                for(var i = 0; i<returnArray.length; i++){
                    console.log(dictionary.database[returnArray[i]].en)
                    console.log('Word Index: ' + returnArray[i] );
                    console.log("Key: " + this.convertFromWordToKey(dictionary.database[returnArray[i]].en));
                    console.log('Secondary Hashing: ' + this.calculateSecondaryHash(a, b, finalArrayLength, dictionary.database[returnArray[i]].en))
                }
                console.log('\n')
                console.log('Final array: ')
                for(var i=0; i<finalArray.length; i++){
                    console.log(i + ' ' + finalArray[i]);
                }

                throw Error('Too many iterations required!');
            }
            
            
            a = Math.floor(Math.random() * (PRIME - 1) ) + 1;
            b = Math.floor(Math.random() * PRIME);

            // If collision is detected, it means the generated
            // finalArray is wrong and should be reset
            finalArray.fill(null);            
        }

        // console.log('Debug: Going out');

        // while loop exists with finalArray completely generated since it was passed by reference
        // Save the values for a, b, and m
        this.hashTableKeys[primaryHashValue] = [a, b, finalArrayLength];
        // Set hashtable[i] = newly generated finalArray aka secondary hashing that has no collision

        return finalArray;  

    }

    noDuplicate(word, array){
        var unique = true;
        for(var i=0; i<array.length; i++){
            if(dictionary.database[array[i]].en == word){
                debug.duplicateWords++;
                unique = false;
                break;
            }
        }

        return unique;
    }


    generatePrimaryHash(word){       
        return this.convertFromWordToKey(word) % dictionary.numberOfWords;
    }

    generateHashTable(){
        this.initializeHashTable();

        for(var i=0; i<dictionary.numberOfWords; i++){
            dictionary.database[i].en = dictionary.database[i].en.toLowerCase();
            var word = dictionary.database[i].en;
            var numValue = this.generatePrimaryHash(word);

            // Secondary Hash is going to contain the indices of the dictionary.database
            // First check if this word already exists
            if(this.noDuplicate(word, this.hashTable[numValue])){
                this.hashTable[numValue].push(i);
            }
        }
        
        console.log('First Layer Hashing Done')

        // Detect Collisions in primary and apply secondary Hashing
        for(var i=0; i<dictionary.numberOfWords; i++){
            if(this.hashTable[i].length > 1){
                // Number of collision detected in this bucket
                // console.log('Secondary Hash Length Before: ' + this.hashTable[i].length);

                this.hashTable[i] = this.generateSecondaryHash(this.hashTable[i], i);
                
                // The new size of hashtable[i].length should be the square of
                // the size hashtable[i] that was passed
                // console.log('Secondary Hash Length After: ' + this.hashTable[i].length);
            }
        }

        console.log('Done Hashing!');

        // debug.statistics(this.hashTable);
    }
}


// Variables

var dictionary = new Dictionary();
var hashing = new Hashing();


// Main function running at page load

window.onload = function initializeHashing(){
    console.log('Working');
    dictionary = fetch(dictionaryDatabaseLink)
        .then(response => {
            if(!response.ok){
                throw new Error("HTTP error " + response.status);
            }
            // Printing response.json will execute the line instantly
            // without waiting for the promise to be fulfilled
            // If you want something to be executed after the promise
            // is fulfilled, try adding another then
            return response.json()
        })
        .then(json => {
            dictionary.database = json;
            dictionary.numberOfWords = Object.keys(dictionary.database).length;
        })
        .then(() => hashing.generateHashTable());
    
    console.log('Size printed');
}

// Actual search function invoked by onkeyup
function search(){
    var input = document.getElementById('query');
    var word = input.value.toLowerCase();
    var output = document.getElementById('output');

    var pHash = hashing.calculatePrimaryHash(word);

    console.log('Primary Hash = ' + pHash);
    console.log(hashing.hashTable[pHash]);

    var sHash = hashing.calculateSecondaryHash(hashing.hashTableKeys[pHash][0],
        hashing.hashTableKeys[pHash][1], hashing.hashTableKeys[pHash][2],
        word);

    console.log('Secondary Hash = ' + sHash);
    
    output.innerHTML = dictionary.database[hashing.hashTable[pHash][sHash]].bn;
}
"use strict";

let nforce = require('nforce'),

    SF_CLIENT_ID = process.env.SF_CLIENT_ID,
    SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET,
    SF_USER_NAME = process.env.SF_USER_NAME,
    SF_PASSWORD = process.env.SF_PASSWORD;

let org = nforce.createConnection({
    clientId: SF_CLIENT_ID,
    clientSecret: SF_CLIENT_SECRET,
    redirectUri: 'http://localhost:3000/oauth/_callback',
    mode: 'single',
    autoRefresh: true
});

let login = () => {
    org.authenticate({username: SF_USER_NAME, password: SF_PASSWORD}, err => {
        if (err) {
            console.error("Authentication error");
            console.error(err);
        } else {
            console.log("Authentication successful");
        }
    });
};

let findVacationByDate = (params) => {
    let where = "";
    if (params) {
        let parts = [];
        if (params.id) parts.push(`Start_Date__c='${params.date}'`);
        if (params.city) parts.push(`City__c='${params.city}'`);
        if (parts.length>0) {
            where = "WHERE " + parts.join(' AND ');
        }
    }
    return new Promise((resolve, reject) => {
        let q = `SELECT Id,
                    Name,
                    City__c,
                    Start_Date__c,
                    End_Date__c,
                    Number_of_Days__c,
                    Total_Cost__c,
                FROM Vacation__c
                ${where}
                LIMIT 1`;
        org.query({query: q}, (err, resp) => {
            if (err) {
                reject(err);
            } else {
                resolve(resp.records[0]);
            }
        });
    });

};

let findVacations = () => {
    return new Promise((resolve, reject) => {
        let q = `SELECT Id,
                    Name,
                    City__c,
                    Start_Date__c,
                    End_Date__c,
                    Number_of_Days__c,
                    Total_Cost__c,
                FROM Vacation__c
                WHERE  Start_Date__c > TODAY()
                ORDER BY Start_Date__c ASC
                LIMIT 3`;
        org.query({query: q}, (err, resp) => {
            if (err) {
                reject("An error as occurred");
            } else {
                resolve(resp.records);
            }
        });
    });
};


let createExpense = (expesnseType, costAmount, vacationId) => {

    return new Promise((resolve, reject) => {
        let e = nforce.createSObject('Expense__c');
        e.set('Type__c', expesnseType);
        e.set('Cost__c', costAmount);
        e.set('Vacation__c', vacationId);

        org.insert({sobject: e}, err => {
            if (err) {
                console.error(err);
                reject("An error occurred while creating a case");
            } else {
                resolve(e);
            }
        });
    });

};

login();

exports.org = org;
exports.findVacationByDate = findVacationByDate;
exports.findVacations = findVacations;
exports.createExpense = createExpense;
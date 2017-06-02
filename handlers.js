"use strict";

let salesforce = require("./salesforce");

exports.SearchVacations = (slots, session, response) => {
    session.attributes.stage = "find_vacations";
    salesforce.findVacations()
            .then(vacations => {
                if (vacations && vacations.length>0) {
                    let text = `<p>OK, here is what I found for upcoming vacations: </p>`;
                    text += '<p>You have ${vacations.length} vacations coming up: </p>'
                    vacations.forEach(vaca => {
                        text += `${vaca.get("Name")}, in ${vaca.get("City__c")} for ${vaca.get("Number_Of_Days__C")} days. Starts on ${vaca.get("Start_Date__c")} and cost $${vaca.get("Cost__c")}. <break time="0.5s" /> `;
                    });
                    response.say(text);
                } else {
                    response.say(`Sorry, I didn't find any upcoming vacations`);
                }
            })
            .catch((err) => {
                console.error(err);
                response.say("Oops. Something went wrong");
            });
};

exports.AddExpense = (slots, session, response) => {
    session.attributes.stage = "ask_date";
    response.ask("OK, add expense to the vacation starting when?");
};

exports.AnswerDate = (slots, session, response) => {
    if (session.attributes.stage === "ask_date") {
        session.attributes.date = slots.Date.value;
        salesforce.findVacationByDate({date: session.attributes.date})
            .then(vacation => {
                if (vacation) {
                    session.attributes.vacationId = vacation.get("Id");
                    session.attributes.vacationName = vacation.get("Name");
                    session.attributes.stage = "ask_type";
                    response.ask("<s>Thank You. </s> Ok, what type of expense?");
                } else {
                    response.say(`Sorry, I didn't find a vacation starting on ${session.attributes.date}`);
                }
            })
            .catch((err) => {
                console.error(err);
                response.say("Oops. Something went wrong");
            });
    } else {
        response.say("Sorry, I didn't understand that");
    }
};

exports.AnswerType = (slots, session, response) => {
    if (session.attributes.stage === "ask_type") {
        session.attributes.type = slots.ExpenseType.value;
        session.attributes.stage = "ask_cost";
        response.ask("<s>Thank You. </s> Ok, and what is the cost of expense?");
    } else {
        response.say("Sorry, I didn't understand that");
    }
};

exports.AnswerCost = (slots, session, response) => {
    if (session.attributes.stage === "ask_cost") {
        session.attributes.cost = slots.Cost.value;
        session.attributes.stage = "create_expense";
        salesforce.createExpense(session.attributes.type, session.attributes.cost, session.attributes.vacationId)
            .then(expense => {
                if(expense && expense.length>0){
                    response.say('Ok, I have add a ${expense.get("Type__c")} expense of $${expense.get("Cost__c") to your ${session.attributes.vacationName} vacation.')
                }
            })
            .catch((err) => {
                console.error(err);
                response.say("Oops. Something went wrong");
            });
        
    } else {
        response.say("Sorry, I didn't understand that");
    }
};
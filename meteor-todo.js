// Global alias for Tasks to use, lets us utilise "use strict"
G = this;
"use strict";

// Create a new collection
G.Tasks = new Mongo.Collection("tasks");

Tasks.find({}); // Part of global alias

// This code only runs on the client
if (Meteor.isClient) {
  Template.body.helpers({
    tasks: function() {
      if (Session.get("hideCompleted")) {
        // If hide completed is checked, filter tasks
        return Tasks.find({ checked: { $ne: true } },
                          { sort: { createdAt: -1 } });
      } else {
        // Otherwise, return all of the tasks
        return Tasks.find({}, { sort: { createdAt: -1 } });
      }
    },
    hideCompleted: function() {
      return Session.get("hideCompleted");
    },
    incompleteCount: function() {
      return Tasks.find({ checked: { $ne: true } }).count();
    }
  });

  Template.body.events({
    // On .new-task submit
    "submit .new-task": function(event) {
      // Prevent default browser form submit
      event.preventDefault();

      // Get value from form element
      var text = event.target.text.value;

      // Insert a task into the collection
      Meteor.call("addTask", text); // Calls Tasks.insert method from Meteor.methods

      // Clear form
      event.target.text.value = "";
    },
    // on .hide-completed tickbox select
    "change .hide-completed": function() {
      Session.set("hideCompleted", event.target.checked);
    }
  });

  Template.task.events({
    "click .toggle-checked": function() {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, !this.checked);
    },
    // Remove task when .delete is clicked
    "click .delete": function() {
      Meteor.call("deleteTask", this._id);
    }
  });

  // Use usernames instead of email addresses
  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
} // end isClient

// Implementing secure insert, update, remove functionality
// after running "meteor remove insecure" to prevent client
// side altering of the DB.
Meteor.methods({
  addTask: function(text) {
    // Make sure the user is logged in before inserting a task
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  deleteTask: function(taskId) {
    Tasks.remove(taskId);
  },
  setChecked: function(taskId, setChecked) {
    Tasks.update(taskId, { $set: { checked: setChecked } });
  }
});

// Server side code
if (Meteor.isServer) {
  Meteor.startup(function() {
    // code to run on server at startup
  });
} // end isServer

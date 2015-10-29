// Global alias for Tasks to use, lets us utilise "use strict"
G = this;
"use strict";

// Create a new collection
G.Tasks = new Mongo.Collection("tasks");

Tasks.find({}); // Part of global alias

// This code only runs on the server
if (Meteor.isServer) {
  // Register a publication named "tasks", and only publish tasks that are
  // public or belong to the current user
  Meteor.publish("tasks", function() {
    return Tasks.find({
      $or: [
        { private: { $ne: true } },
        { owner: this.userId }
      ]
    });
  });
} // end isServer

// This code only runs on the client
if (Meteor.isClient) {
  // Subscribes to all data from the tasks publication
  Meteor.subscribe("tasks");

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

  Template.task.helpers({
    // Check if user owns task
    isOwner: function() {
      return this.owner === Meteor.userId();
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
    },
    // Event handler for public/private button button
    "click .toggle-private": function() {
      Meteor.call("setPrivate", this._id, !this.private);
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
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.error("not-authorized");
    }

    Tasks.remove(taskId);
  },
  setChecked: function(taskId, setChecked) {
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can check it off
      throw new Meteor.Error("not-authorized");
    }

    Tasks.update(taskId, { $set: { checked: setChecked } });
  },
  setPrivate: function(taskId, setToPrivate) {
    var task = Tasks.findOne(taskId);

    // Make sure only the task owner can make a task private
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.update(taskId, { $set: { private: setToPrivate } });
  }
}); // end methods

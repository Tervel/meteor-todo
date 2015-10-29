// Create a new collection
Tasks = new Mongo.Collection("tasks");

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
      Tasks.insert({
        text: text,
        createdAt: new Date(), // current time
        owner: Meteor.userId(), // _id of logged in user
        username: Meteor.user().username // username of logged in user
      });

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
      Tasks.update(this._id, { // every inserted document has a unique _id field, current task == this._id
        $set: { checked: !this.checked }
      });
    },
    // Remove task when .delete is clicked
    "click .delete": function() {
      Tasks.remove(this._id);
    }
  });

  // Use usernames instead of email addresses
  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
} // end isClient

// Server side code
if (Meteor.isServer) {
  Meteor.startup(function() {
    // code to run on server at startup
  });
} // end isServer

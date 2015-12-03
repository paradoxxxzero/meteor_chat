Chats = new Mongo.Collection('chats')

r = i => Math.random() * i <<0
random_color = () => `hsla(${r(360)}, 100%, 75%, 1)`

if (Meteor.isClient) {
  Meteor.subscribe("userData")
  Meteor.subscribe("chats")

  Template.body.helpers({
    chats: Chats.find({}, {sort: {ts: -1}, limit: 100})
  })

  Template.body.events({
    "submit .chat-input": event => {
      event.preventDefault()
      Meteor.call('talk', event.target.chat.value)
      event.target.chat.value = ""
    },
    "click .chats": e => document.querySelector('.chat-prompt').focus()
  })

  Template.chat.helpers({
    timestamp: function () {
      return this.ts.toLocaleString()
    }
  });

  Tracker.autorun(() => {
    var chats = document.querySelector('.chats')

    if (chats) {
      chats.scrollTo(Infinity)
    }
  })

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  })
}

Meteor.methods({
  talk: (chat) => {
    if (!Meteor.userId() || !chat) {
      return
    }
    if (!Meteor.user().color) {
      Meteor.users.update(Meteor.userId(), {$set: {color: random_color()}})
    }
    Chats.insert({
      text: chat,
      user: Meteor.user().username,
      color: Meteor.user().color,
      ts: new Date()
    })
  }
})

if (Meteor.isServer) {
  Meteor.users.allow({
    update: function (userId, doc, fields, modifier) {
      print(userId)
      return true
    }
  })
  Meteor.publish("userData", function () {
    if (this.userId) {
      return Meteor.users.find({
        _id: this.userId
      }, {
        fields: {'color': 1}
      })
    } else {
      this.ready()
    }
  })
  Meteor.publish("chats", function () {
    return Chats.find()
  })
  Meteor.startup(function () {})
}

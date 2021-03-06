const {model, Schema, ObjectId} = require('mongoose')


const Theme = new Schema({
    name: {type: String, required: true},
    discription: {type: String},
    order: {type: Number},
    isPublic: {type: Boolean, default: false},
    pictureName: {type: String, default: 'default'}
})

module.exports = model('Theme', Theme)

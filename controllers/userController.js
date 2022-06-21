const User = require("../models/User")
const bcrypt = require("bcryptjs")
const { validationResult } = require("express-validator")
const fileService = require('../services/fileService')
const File = require('../models/File')
const path = require('path')
const fs = require('fs')
const fsPromises = fs.promises;
/* const { promisify } = require('util')
const fsExistsAsync = promisify(fs.exists) */


class userController {

    async registration(req, res) {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: "Ошибка регистрации: " + errors.array()[0].msg })
            }
            const { phon, password, name, surname } = req.body
            const candidate = await User.findOne({ phon })
            if (candidate) {
                return res.status(400).json({ message: `Пользователь с номером телефона +7${phon} уже существует` })
            }
            const hashPassword = await bcrypt.hash(password, 8)
            const user = new User({ phon, password: hashPassword, name, surname })
            await user.save()
            await fileService.createDir(req, new File({ user: user.id, name: '' }))
            const userList = await User.find({ role: "STUDENT" }, { password: 0 })
            return res.json(userList)
        } catch (e) {
            console.log(e)
            res.send({ message: "Server error" })
        }
    }

    async getUserList(req, res) {
        try {
            const userList = await User.find({ role: "STUDENT" }, { password: 0 })
            return res.json(userList)
        } catch (e) {
            console.log(e)
            return res.status(500).json({ message: "Can not get users" })
        }
    }
    async editUser(req, res) {
        try {
            const user = await User.findById(req.body.id)
            for (let key in req.body) {
                user[key] = req.body[key]
            }
            await user.save()
            const userList = await User.find({ role: "STUDENT" }, { password: 0 })
            return res.json(userList)
        }
        catch (e) {
            return res.status(500).json({ message: "Can not save user change" })
        }
    }
    async deleteUser(req, res) {
        try {
            const id = req.query.id
            console.log('id ' + JSON.stringify(req.query))
            const user = await User.findById(id)
            const filePath = path.join(req.filePath, 'users', id)
            await user.remove()
            if (fs.existsSync(filePath)) {
                fs.rmSync(filePath, { recursive: true })
            }
            const userList = await User.find({ role: "STUDENT" }, { password: 0 })
            return res.json(userList)
        }
        catch (e) {
            console.log('Ошибка при удал пользователя')
            console.log(e)
            return res.status(500).json({ message: 'Ошибка при удалении пользователя' })
        }
    }

    async changePassword(req, res) {
        try {
            const user = await User.findById(req.body.id)
            user.password = req.body.password
            await user.save()
            return res.json('Изменение пароля прошло успешно')
        }
        catch (e) {
            console.log(e)
            return res.status(500).json({ message: 'Ошибка при изменении пароля' })
        }
    }

    async getUserExtend(req, res) {
        try {
            let user = await User.findById(req.query.id, { password: 0 })
            user = JSON.parse(JSON.stringify(user))
            const filesPath = path.join(req.filePath, 'users', user._id, req.query.folder)
            console.log('DN1: ' + Date.now())
            if (fs.existsSync(filesPath)) {
                user.files = await fsPromises.readdir(filesPath)
                user.files1 = user.files.map(async file => {
                    console.log('DN3: ' + Date.now())
                    const statFile = await fsPromises.stat(path.join(filesPath, file))
                    console.log('DN4: ' + Date.now())
                    return {name: file, time: statFile.mtime, size: statFile.size}
                })
                console.log('fffgb ' + JSON.stringify(user.files1))
                console.log('PPPPPP ' + JSON.stringify(user.files))
            } else {
                user.files = []
            }
            console.log('DN2: ' + Date.now())
            return res.json(user)
        }
        catch (e) {
            console.log('Error ' + e)
            return res.status(500).json({ message: "Can not get extend user" })
        }
    }
}

module.exports = new userController()

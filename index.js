import { homedir } from "os"
import readline from "readline"
import { EventEmitter } from "events"

const homeDirectory = homedir()
let user = process.argv.find(arg => arg.startsWith('--username='))?.split('=')[1] || 'Anonymous'
if (user === 'Anonymous') {
  console.log('no user name. default name: Anonymous')
}

process.chdir(homeDirectory)

const cli = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const commandHandler = new EventEmitter()

commandHandler.on('exit', () => {
  console.log(`thanks for using file manager, ${user}, good bye!`)
  cli.close()
})

const showCurrentDirectory = () => {
  console.log(`current working directory is: ${process.cwd()}`)
}

console.log(`welcome to file manager, ${user}!`)
showCurrentDirectory()

cli.on('line', (input) => {
  const [command, ...args] = input.trim().split(/\s+/)
  if (command === '.exit') {
    commandHandler.emit('exit')
  } else {
    console.log(`Invalid input: ${command}`)
    showCurrentDirectory()
  }
})

cli.on('SIGINT', () => {
  commandHandler.emit('exit')
})

import { homedir } from "os"
import readline from "readline"
import path, {resolve} from 'path'

const homeDirectory = homedir()
let user = process.argv.find(function(arg) { return arg.startsWith('--username=') })?.split('=')[1] || 'Anonymous'
if (user === 'Anonymous') {
  console.log('Username was not provided, defaulting to Anonymous')
}

process.chdir(homeDirectory)

const cli = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function up() {
  const currentDir = process.cwd()
  const parentDir = path.parse(currentDir).root === currentDir ? currentDir : path.join(currentDir, "..")
  process.chdir(parentDir)
  showCurrentDirectory()
}

function showCurrentDirectory() {
  console.log(`You are currently in ${process.cwd()}`)
}

const commands = {
  up: up,
  cd: cd
}

console.log(`Welcome to the File Manager, ${user}!`)
showCurrentDirectory()

cli.on('line', function(input) {
  const [command, ...args] = input.trim().split(/\s+/)
  if (command === '.exit') {
    console.log(`Thank you for using File Manager, ${user}, goodbye!`)
    cli.close()
  } else if (commands[command]) {
    commands[command](...args)
  } else {
    console.log(`Invalid command: ${command}`)
    showCurrentDirectory()
  }
})

function cd(directory) {
  const targetDirectory = resolve(process.cwd(), directory)
  try {
    process.chdir(targetDirectory)
    console.log(`Now in ${process.cwd()}`)
  } catch {
    console.log(`Failed to change directory to ${directory}`)
  }
}

cli.on('SIGINT', function() {
  console.log(`Thank you for using File Manager, ${user}, goodbye!`)
  cli.close()
})


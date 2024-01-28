import readline from 'readline'
import os from 'os'
import {inputCommandsHandler} from './inputCommands.js'

const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export const getUsername = () => {
  const usernameArg = process.argv.find(arg => arg.startsWith('--username'))
  const usernameValue = usernameArg.split('=')[1]
  return usernameValue || 'John Doe'
}

const getGreeting = () => {
  console.log(`Welcome to the File Manager, ${getUsername()}`)
}

export const getCurrentDirectory = () => {
  const currentDirectory = process.cwd()
  console.log(`You are currently in ${currentDirectory}`)
}

const setUserHomeAsWorkingDirectory = () => {
  const startingWorkingDirectory = os.homedir()
  process.chdir(startingWorkingDirectory)
}

readlineInterface.on('line', (input) => {
  inputCommandsHandler(input)
})

readlineInterface.on('close', () => {
  console.log(`Thank you for using File Manager, ${getUsername()}, goodbye!`)
})

setUserHomeAsWorkingDirectory()
getGreeting()
getCurrentDirectory()

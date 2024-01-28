import {getUsername} from './index.js'
import os from 'os'

const exit = () => {
  console.log(`Thank you for using File Manager, ${getUsername()}, goodbye!`)
  process.exit(0)
}

const up = (directory) => {
  const currentDirectory = process.cwd()
  const rootDirectory = os.homedir()

  if(directory === 'up' && !currentDirectory.startsWith(rootDirectory)) {
    process.chdir('..')
    console.log(currentDirectory)
  } else {
    console.log(currentDirectory)
  }
}

export const inputCommands = {
  '.exit': exit,
  'up': up
}

const getInvalidInput = () => {
  console.log('Invalid input')
}

export const inputCommandsHandler = (input) => {
  console.log('input', input)
  inputCommands.hasOwnProperty(input)
    ? inputCommands[input]()
    : getInvalidInput()
}

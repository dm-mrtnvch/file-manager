import {getCurrentDirectory, getUsername} from './index.js'
import os from 'os'
import path from 'path'
import fs from 'fs'

function exit() {
  console.log(`Thank you for using File Manager, ${getUsername()}, goodbye!`)
  process.exit(0)
}

function up(directory) {
  const currentDirectory = process.cwd()
  const rootDirectory = os.homedir()

  if (directory === 'up' && !currentDirectory.startsWith(rootDirectory)) {
    process.chdir('..')
    console.log(currentDirectory)
  } else {
    console.log(currentDirectory)
  }
}

function cd(directory) {
  const currentDirectory = process.cwd()
  const rootDirectory = os.homedir()

  if (directory.startsWith('./') || path.isAbsolute(directory)) {
    const targetDirectory = path.resolve(currentDirectory, directory)

    if (targetDirectory.startsWith(rootDirectory)) {
      try {
        process.chdir(targetDirectory)
        getCurrentDirectory()
      } catch (e) {
        getInvalidInput()
      }
    } else {
      getInvalidInput()
    }
  } else {
    getInvalidInput()
  }
}

export const inputCommands = {
  '.exit': exit,
  'up': up,
  'ls': list
}

function getInvalidInput() {
  console.log('Invalid input')
}

export function inputCommandsHandler(input) {
  if (input.startsWith('cd ')) {
    const directory = input.slice(3)
    cd(directory)
  } else if (inputCommands.hasOwnProperty(input)) {
    inputCommands[input]()
  } else {
    getInvalidInput()
  }
}

function list ()  {
  const currentDirectory = process.cwd()
  fs.readdir(currentDirectory, { withFileTypes: true }, (err, items) => {
    if (err) {
      console.log('Error reading directory')
      return
    }

    const sortedItems = items
      .map(item => ({
        Name: item.name,
        Type: item.isDirectory() ? 'directory' : 'file'
      }))
      .sort((a, b) => {
        if (a.Type === b.Type) {
          return a.Name.localeCompare(b.Name)
        }
        return a.Type === 'directory' ? -1 : 1
      })

    console.table(sortedItems)
  })
}


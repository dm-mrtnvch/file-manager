import { homedir } from "os"
import readline from "readline"
import path, {resolve, format, dirname, basename, join} from 'path'
import fs from 'fs/promises'
import { cwd } from 'process'
import { createReadStream } from 'fs'

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
  cd: cd,
  ls: ls,
  cat: displayFileContent,
  add: createEmptyFile,
  rn: renameFile,
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

async function ls() {
  try {
    const entries = await fs.readdir(cwd(), { withFileTypes: true })
    const folders = entries.filter(entry => entry.isDirectory()).map(dir => ({ Name: dir.name, Type: 'Directory' }))
    const files = entries.filter(entry => entry.isFile()).map(file => ({ Name: file.name, Type: 'File' }))
    const links = entries.filter(entry => entry.isSymbolicLink()).map(link => ({ Name: link.name, Type: 'Symbolic Link' }))

    const sortedFolders = folders.sort((a, b) => a.Name.localeCompare(b.Name))
    const sortedFiles = files.sort((a, b) => a.Name.localeCompare(b.Name))
    const sortedLinks = links.sort((a, b) => a.Name.localeCompare(b.Name))

    const combinedList = [...sortedFolders, ...sortedFiles, ...sortedLinks]
    if (combinedList.length === 0) {
      console.log('Directory is empty')
    } else {
      console.table(combinedList)
    }
  } catch {
    console.log('Failed to list directory contents')
  }
}

function displayFileContent(filePath) {
  const fullPath = resolve(process.cwd(), filePath)
  const stream = createReadStream(fullPath)

  stream.on('open', () => {
    stream.pipe(process.stdout)
  })

  stream.on('error', (error) => {
    if (error.code === 'ENOENT') {
      console.log('File does not exist')
    } else {
      console.log('Error reading file')
    }
  })
}

async function createEmptyFile(fileName) {
  const fullPath = resolve(process.cwd(), fileName)
  try {
    await fs.writeFile(fullPath, '')
    console.log(`${fileName} file has been created`)
  } catch (error) {
    if (error.code === 'EEXIST') {
      console.log('Cannot create the file: it already exists')
    } else {
      console.log('Failed to create the file')
    }
  }
}

async function renameFile(oldPath, newName) {
  const sourcePath = resolve(process.cwd(), oldPath);
  const destinationPath = join(dirname(sourcePath), newName);

  try {
    await fs.rename(sourcePath, destinationPath);
    console.log(`${basename(oldPath)} has been renamed to ${newName}`);
  } catch (error) {
    console.log('Failed to rename the file. Make sure the file exists and the new name is valid.');
  }
}

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


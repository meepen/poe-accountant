# Welcome to the AI instructions for this application

This repository is set up for application development utilizing React + Panda CSS & TS backend

## Overview of Project

This project uses go-task. Utilize task commands every time you want to run a project specific command through any utilities specific to this project. If an existing command exists, ensure you are following DRY principals and create a function both of them can call if it is possible.

This project utilizes pnpm and pnpm workspace dependencies. Always use pnpm when interacting with node / TypeScript & always use workspace dependencies if going between projects.

This project uses a strictly structured format. All directories directly related should be next to each other. See [the projects directory](../projects)

This project utilizes Terraform and Docker. When updating infrastructure, ensure both are updated.

### Running commands

Whenever you can, especially when a command needs environment variables that could be provided in .env, utilize or set up a command that is generic enough to run through the go-task system. The go-task system should always be invoked from the root directory as to provide the environment variables to the resulting tasks.

### Taskfile naming conventions

Use namespaced include aliases in the root [Taskfile.yml](../Taskfile.yml) with `:` separators.

- Project includes should use short names like `game`, `mobile`, `shared`, `tauri`.
- Platform includes should use the `platform:<name>` format (for example `platform:android`, `platform:tauri`).
- Cross-include task calls should preserve the namespaced shape (for example `platform:android:package`).

### Environment files

Utilize [the .env.template file](../.env.example) to add new variables. Cleanly separate the environment variables into chunks that make sense, and if you need a variable that should be the same named two different things, add to a bottom section that is just a bunch of lines like: `VAR_2=${VAR_1}`

### Git

Always update the gitignore files if necessary.

## Modern Code

Always use the latest features of any platform you are deploying to. Terraform, ECMAScript, etc. Set up your project files to be modular if you are using TypeScript [the api tsconfig example](../projects/api/project/tsconfig.json)

### DRY

Don't repeat yourself. Always write code in a way that is easily expandable and reusable later on. Break down files into smaller chunks, and put them in the directories or projects that make sense

## Deploying

Deploying should always be as simple as `task install && task start`. If it doesn't work that way, fix it.

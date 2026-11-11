// Resolve the CLI from this workspace so hoisted and local installs both work.
// Node's heap allowance is configured by the package start command.
require('expo/bin/cli');

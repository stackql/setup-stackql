import os from 'os';
import path from 'path';

// If we're on Windows, then the executable ends with .exe
const exeSuffix = os.platform().startsWith('win') ? '.exe' : '';

const pathToCLI = [process.env.STACKQL_CLI_PATH, `stackql-bin${exeSuffix}`].join(path.sep);

export default pathToCLI;

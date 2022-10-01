import Box from '@mui/material/Box';

const tsxMake = (dirNames: string[]) => {
  return dirNames.map((item) => {
    return <Box key={Math.random()}>{item}</Box>;
  });
};

export default tsxMake;

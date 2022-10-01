import Box from '@mui/material/Box';
import { SxProps } from '@mui/system';
import { Theme } from '@mui/material/styles';

export default function BeginCard(props: {
  text: string;
  onClick: () => void;
  sx?: SxProps<Theme>;
}) {
  const { text, sx = {}, onClick } = props;

  return (
    <Box
      sx={{
        ...sx,
        display: 'inline-block',
        userSelect: 'none',
        padding: '20px 50px',
        backgroundColor: '#f8f8f8',
        cursor: 'pointer',
        borderRadius: '7px',
        width: '350px',
        textAlign: 'center',
        fontSize: '20px',
        '&:hover': {
          outline: '3px solid #9f9dff',
        },
        '&:active': {
          backgroundColor: '#9f9dff',
          color: '#fff',
        },
      }}
      onClick={onClick}
    >
      {text}
    </Box>
  );
}

'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { createClient } from '@/features/auth/auth-api';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface Trainer {
  id: string;
  name: string;
  email: string;
  clients: Client[];
}

interface DashboardClientProps {
  trainer: Trainer;
  onClientAdded?: (client: Client) => void;
}

export default function DashboardClient({ trainer, onClientAdded }: DashboardClientProps) {
  const theme = useTheme();
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [clients, setClients] = useState<Client[]>(trainer.clients);

  const handleAddClient = async () => {
    try {
      const result = await createClient({
        ...newClient,
        trainerId: trainer.id,
      });
      const addedClient: Client = {
        id: result.id,
        name: result.name,
        email: result.email ?? '',
        phone: result.phone,
      };
      const { tempPassword } = result;
      setClients([...clients, addedClient]);
      onClientAdded?.(addedClient);
      setIsAddClientModalOpen(false);
      setNewClient({ name: '', email: '', phone: '' });

      alert(`Client created successfully!\nTemporary password: ${tempPassword}\nPlease share this with the client.`);
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Failed to add client. Please try again.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          background: theme.palette.primary.main,
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          flexWrap: { xs: 'wrap', sm: 'nowrap' }
        }}>
          <Avatar 
            sx={{ 
              width: 64, 
              height: 64,
              bgcolor: 'white',
              color: theme.palette.primary.main,
            }}
          >
            {trainer.name.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1">
              Welcome back, {trainer.name}!
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
              Manage your clients and track their progress
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddClientModalOpen(true)}
            sx={{ 
              bgcolor: 'white',
              color: theme.palette.primary.main,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
              },
            }}
          >
            Add Client
          </Button>
        </Box>
      </Paper>

      {/* Stats Section */}
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        mb: 3,
        flexDirection: { xs: 'column', md: 'row' }
      }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Clients
            </Typography>
            <Typography variant="h3">
              {clients.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Clients
            </Typography>
            <Typography variant="h3">
              {clients.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              New This Month
            </Typography>
            <Typography variant="h3">
              0
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Clients List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Clients
          </Typography>
          <List>
            {clients.map((client: Client, index: number) => (
              <Box key={client.id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={client.name}
                    secondary={client.email}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton edge="end" aria-label="edit">
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
                {index < clients.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Add Client Modal */}
      <Dialog 
        open={isAddClientModalOpen} 
        onClose={() => setIsAddClientModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Client</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Phone"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddClientModalOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddClient} 
            variant="contained"
            disabled={!newClient.name || !newClient.email}
          >
            Add Client
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
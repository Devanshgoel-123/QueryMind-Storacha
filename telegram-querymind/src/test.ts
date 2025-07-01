import axios from 'axios';

axios.get('https://api.trychroma.com/v1/collections', {
  headers: {
    Authorization: 'Bearer ck-EWyLGP4zboR3qvAQ6rUm5QtqpSPDVttBzRykBmqZH7xq',
  },
})
.then(res => console.log('✅ Connection OK:', res.data))
.catch(err => console.error('❌ Connection failed:', err.message));

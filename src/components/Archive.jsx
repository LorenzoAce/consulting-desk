import React, { useEffect, useState } from 'react';
import { FileText, Search, Calendar, User, Building, Trash2, Edit } from 'lucide-react';

const Archive = ({ onLoadCard }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
      const response = await fetch(`${apiUrl}/api/cards`);
      if (response.ok) {
        const data = await response.json();
        setCards(data);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCard = async (id, e) => {
    e.stopPropagation(); // Prevent card click
    if (!window.confirm('Sei sicuro di voler eliminare questa scheda?')) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
      const response = await fetch(`${apiUrl}/api/cards/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCards(cards.filter(card => card.id !== id));
      } else {
        alert('Errore durante l\'eliminazione della scheda');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const filteredCards = cards.filter(card => 
    card.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Archivio Schede</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Cerca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card) => (
          <div key={card.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(card.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{card.business_name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1">
              <User className="h-3 w-3" />
              {card.full_name}
            </p>

            <div className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-4 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Provincia:</span>
                <span className="font-medium text-gray-900 dark:text-white">{card.province}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Interesse:</span>
                <span className="font-medium text-gray-900 dark:text-white">{card.main_interest}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Consulente:</span>
                <span className="font-medium text-gray-900 dark:text-white">{card.assigned_consultant || '-'}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onLoadCard(card)}
                className="flex-1 flex justify-center items-center gap-1 py-2 px-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <Edit className="h-4 w-4" /> Carica
              </button>
              <button
                onClick={(e) => deleteCard(card.id, e)}
                className="flex justify-center items-center gap-1 py-2 px-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Nessuna scheda trovata nell'archivio.</p>
        </div>
      )}
    </div>
  );
};

export default Archive;

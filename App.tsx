
import React from 'react';
import { ConversationView } from './components/ConversationView';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold text-red-600 dark:text-red-500">RIA</h1>
          <p className="text-lg mt-2 text-gray-600 dark:text-gray-400">Powered by Gemini 2.5 Native Audio</p>
        </header>
        <main className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <ConversationView />
        </main>
        <footer className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; 2024 Zomato AI Division. This is a demonstration application.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;

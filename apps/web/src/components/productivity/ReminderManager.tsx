import { useState } from 'react';

interface Reminder {
  id: string;
  message: string;
  scheduledFor: string;
  sent: boolean;
}

interface ReminderManagerProps {
  reminders: Reminder[];
  onAdd?: (message: string, scheduledFor: string) => void;
  onDelete?: (id: string) => void;
}

export function ReminderManager({ reminders, onAdd, onDelete }: ReminderManagerProps) {
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message && date && time) {
      const scheduledFor = `${date}T${time}`;
      onAdd?.(message, scheduledFor);
      setMessage('');
      setDate('');
      setTime('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
      <div className="p-4 border-b border-gray-300 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reminders</h3>
      </div>
      
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3 mb-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What do you want to be reminded about?"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Add Reminder
          </button>
        </form>

        <div className="space-y-2">
          {reminders.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">No reminders set</p>
          ) : (
            reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-3 rounded border ${
                  reminder.sent
                    ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{reminder.message}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(reminder.scheduledFor).toLocaleString()}
                      {reminder.sent && ' (Sent)'}
                    </p>
                  </div>
                  <button
                    onClick={() => onDelete?.(reminder.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

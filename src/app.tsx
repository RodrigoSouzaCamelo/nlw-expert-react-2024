import { ChangeEvent, useState } from 'react';
import logo from './assets/logo-nlw-expert.svg';
import { NewNoteCard } from './components/new-note-card';
import { NoteCard } from './components/note-card';
import { generateUIID } from './utils/security/generate-uuid';

interface Note {
  id: string;
  date: Date;
  content: string;
}

export function App() {
  const [search, setSearch] = useState('');

  const [notes, setNotes] = useState<Note[]>(() => {
    const notesOnStorage = localStorage.getItem('notes');

    if(!notesOnStorage) return [];
    
    return JSON.parse(notesOnStorage);
  });

  const filteredNotes = search !== ''
    ? notes.filter(note => note.content.toLocaleLowerCase().includes(search))
    : notes;

  function onNoteCreated(content: string) {
    const newNote = {
      id: generateUIID(),
      date: new Date(),
      content
    };

    const newNotes = [newNote, ...notes];

    setNotes(newNotes);

    localStorage.setItem('notes', JSON.stringify(newNotes));
  }

  function onNoteDeleted(id: string) {
    const newNotes = notes.filter(note => note.id !== id);
    setNotes([...newNotes]);
  }

  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    const query = event.target.value;

    setSearch(query);
  }

  return (
    <div className='mx-auto max-w-6xl my-12 space-y-6 px-5'>
      <img src={logo} alt='NLW Expert' />

      <form className='w-full'>
        <input
          type='text'
          onChange={handleSearch}
          placeholder='Busque em suas notas...'
          className='w-full bg-transparent text-3xl font-semibold tracking-tighter outline-none placeholder:text-slate-500'
        />
      </form>

      <div className='h-px bg-slate-700' />

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[250px]'>
        <NewNoteCard onNoteCreated={onNoteCreated} />

        {
          filteredNotes.map(note => (
            <NoteCard 
              key={note.id} 
              date={note.date} 
              content={note.content} 
              onNoteDeleted={() => onNoteDeleted(note.id)}
            />
          ))
        }
      </div>
    </div>
  );
}
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import { toast } from 'sonner';

interface ExtendedPermissions extends Permissions {
  request: (permissionDesc: PermissionDescriptor) => Promise<PermissionStatus>;
}

interface NewNoteCardProps {
  onNoteCreated: (content: string) => void;
}

let speechRecognition: SpeechRecognition | null = null;

export function NewNoteCard({ onNoteCreated }: NewNoteCardProps) {
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(true);

  function handleStartEditor() {
    setShouldShowOnboarding(value => !value);
  }

  function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setContent(event.target.value);
    if (!event.target.value) setShouldShowOnboarding(true);
  }

  function handleSaveNote(): void {

    if (!content) return;

    setContent('');

    setShouldShowOnboarding(true);

    toast.success('Nota criada com sucesso');

    onNoteCreated(content);
  }

  async function hasPermissionAudio() {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      if (permissionStatus.state === 'granted') return true;

      if (permissionStatus.state === 'prompt') {
        const extendedPermissions = navigator.permissions as ExtendedPermissions;
        const newPermissionStatus = await extendedPermissions.request({ name: 'microphone' as PermissionName });

        return newPermissionStatus.state === 'granted';
      }

      return false;
    } catch (error) {
      console.error('Erro ao solicitar permissão para acessar o microfone:', error);
      return false;
    }
  }

  async function handleStartRecording() {
    const isSpeechRecognitionAPIAvailable = 'SpeechRecognition' in window
      || 'webkitSpeechRecognition' in window;

    if (!isSpeechRecognitionAPIAvailable) {
      alert('Infelizmente seu navegador não suporta a API de gravação!');
      return;
    }

    setIsRecording(true);
    setShouldShowOnboarding(false);

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    speechRecognition = new SpeechRecognitionAPI();

    speechRecognition.lang = 'pt-BR';
    speechRecognition.continuous = true;
    speechRecognition.maxAlternatives = 1;
    speechRecognition.interimResults = true;

    speechRecognition.onresult = (event) => {
      const transcription = Array.from(event.results).reduce((text, result) => {
        return text.concat(result[0].transcript)
      }, '');

      setContent(transcription);
    }

    speechRecognition.onerror = (error) => {
      console.error(error);
    }

    speechRecognition.start();

    if (!await hasPermissionAudio()) {
      speechRecognition.stop();
      setIsRecording(value => !value);
      setShouldShowOnboarding(value => !value);
      alert('Ative a permissão para acesso ao microfone do seu dispositivo.');
      return;
    }
  }

  function handleStopRecording() {
    setIsRecording(false);
    speechRecognition?.stop();
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger className='rounded-md flex flex-col bg-slate-700 text-left p-5 gap-3 outline-none hover:ring-2 hover:ring-slate-600 focus-visible:ring-2 focus-visible:ring-lime-400'>
        <span className='text-sm font-medium text-slate-200'>
          Adicionar nota
        </span>
        <p className='text-sm leading-6 text-slate-400'>
          Grave uma nota em áudio que será convertida para texto automaticamente.
        </p>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className='inset-0 fixed bg-black/50' />

        <Dialog.Content className='fixed overflow-hidden inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-[640px] w-full md:h-[60vh] bg-slate-700 md:rounded-md flex flex-col'>
          <Dialog.Close className='absolute right-0 top-0 bg-slate-800 p-1.5 text-slate-400 hover:text-slate-100'>
            <X className='size-5' />
          </Dialog.Close>

          <form className='flex flex-1 flex-col'>
            <div className='flex flex-1 flex-col gap-3 p-5'>
              <span className='text-sm font-medium text-slate-300'>
                Adicionar nota
              </span>
              {shouldShowOnboarding ? (
                <p className='text-sm leading-6 text-slate-400'>
                  Comece <button type='button' onClick={handleStartRecording} className='font-medium text-lime-400 hover:underline'>gravando uma nota</button> em áudio ou se preferir <button type='button' onClick={handleStartEditor} className='font-medium text-lime-400 hover:underline'>utilize apenas texto</button>.
                </p>
              ) : (
                <textarea

                  value={content}
                  onChange={handleContentChange}
                  className='text-sm leading-6 text-slate-400 bg-transparent resize-none flex-1 outline-none'
                />
              )}
            </div>

            {isRecording ? (
              <button
                type='button'
                onClick={handleStopRecording}
                className='w-full flex items-center justify-center gap-2 bg-slate-900 py-4 text-center text-slate-300 outline-none font-medium hover:text-slate-100'
              >
                <div className='size-3 rounded-full bg-red-500 animate-pulse' />
                Gravando! (clique p/ interromper)
              </button>
            ) : (
              <button
                type='button'
                onClick={handleSaveNote}
                className='w-full bg-lime-400 py-4 text-center text-lime-950 outline-none font-medium hover:bg-lime-500'
              >
                Salvar nota
              </button>
            )}

          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
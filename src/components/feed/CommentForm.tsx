'use client';

import { useActionState, useRef } from 'react';

import { addComment, type CommentState } from '@/actions/social';
import { Button, Card, ErrorNote } from '@/components/ui';

/** Yorum formu. Gonderim sonrasi alan temizlenir ve odak alanda kalir. */
export function CommentForm({ postId }: { postId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<CommentState, FormData>(async (prev, formData) => {
    const result = await addComment(prev, formData);
    if (!result.error) formRef.current?.reset();
    return result;
  }, {});

  return (
    <Card className="p-3">
      <form ref={formRef} action={formAction} className="space-y-2">
        <input type="hidden" name="postId" value={postId} />
        <label htmlFor="comment-body" className="sr-only">
          Yorumun
        </label>
        <textarea
          id="comment-body"
          name="body"
          rows={2}
          required
          minLength={2}
          maxLength={600}
          placeholder="Yorumunu yaz…"
          className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2"
        />
        {state.error ? <ErrorNote>{state.error}</ErrorNote> : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? 'Gönderiliyor…' : 'Yorum yap'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

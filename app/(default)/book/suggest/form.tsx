'use client';

import styles from './page.module.css';
import { ApiBookSuggest } from '@/app/api/book/suggest/route';
import { source } from '@/lib/request';
import { Genres, BookTypes, Languages } from '@/lib/types';
import { resizeImage } from '@/lib/utils';
import { Validate } from '@/lib/validate';
import { useForm } from '@infinityfx/control';
import { DateField, Field, NumberField, Select, Textarea, Button, FileField, Tabs, Tooltip } from '@infinityfx/fluid';
import { Author, BookType } from '@prisma/client';
import { useState, Fragment, useRef } from 'react';
import { IoAdd, IoClipboard } from 'react-icons/io5';
import AddAuthor from './add-author';

export default function Form({ authors }: { authors: Author[]; }) {
    const [showAuthorModal, toggleAuthorModal] = useState(false);
    const [authorList, setAuthorList] = useState(authors);
    const [editionIndex, setEditionIndex] = useState(0);
    const fileInput = useRef<(HTMLInputElement | null)[]>([]);

    const form = useForm({
        initial: {
            title: '',
            author: '' as Author | '',
            genre: '' as keyof typeof Genres | '',
            description: '',
            editions: [
                {
                    id: '',
                    type: '' as BookType | '',
                    published: null as Date | null,
                    cover: '',
                    pages: 0,
                    language: ''
                }
            ]
        },
        onValidate(values) {
            return new Validate(values)
                .req('title')
                .req('author')
                .req('description')
                .in('genre', Genres)
                .do('editions', function (editions) {
                    if (editions.some(edition => edition.id.length < 13 ||
                        !edition.published ||
                        !edition.language ||
                        !edition.cover ||
                        !edition.language)) return 'One or more editions are invalid.';
                }).errors;
        },
        onSubmit: async (values: ApiBookSuggest[1]) => {
            const { suggestion } = await source<ApiBookSuggest>('/api/book/suggest', values);

            if (!suggestion) {
                alert('Something went wrong, please try again!');
            } else {
                form.reset();
                alert('Addition requested!');
            }
        }
    });

    async function pasteImage(index: number) {
        const input = fileInput.current[index];
        if (!input) return;

        const items = await navigator.clipboard.read();

        for (const item of items) {
            const type = item.types.find(type => ['image/jpeg', 'image/jpg', 'image/png'].includes(type));
            if (!type) continue;

            const blob = await item.getType(type);
            const html = await item.getType('text/html');

            const text = await html.text();
            const name = text.match(/\/([^\/]+)"/)?.[1] || 'unknown';

            const data = new DataTransfer();
            data.items.add(new File([blob], name, { type: blob.type }));
            input.files = data.files;

            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    const editions = form.values.editions;

    type Edition = (typeof form.values.editions)[number];
    function setEditionField<T extends keyof Edition>(index: number, field: T, value: Edition[T]) {
        editions[index][field] = value;

        form.setValues({
            editions: [...editions]
        });
    }

    return <>
        <AddAuthor
            show={showAuthorModal}
            onClose={() => toggleAuthorModal(false)}
            authors={authorList}
            setAuthors={setAuthorList} />

        <div className={styles.row}>
            <Field label="Title" {...form.fieldProps('title')} />
            <Select label="Genre"
                searchable
                error={form.touched.genre && form.errors.genre}
                options={Object.entries(Genres).map(([value, label]) => ({ value, label }))}
                value={form.values.genre}
                onChange={genre => form.setValues({ genre })} />

            <div className={styles.joined}>
                <Select label="Author"
                    searchable
                    error={form.touched.author && form.errors.author}
                    value={typeof form.values.author === 'string' ? '' : form.values.author.id}
                    onChange={val => form.setValues({ author: authorList.find(author => author.id === val) })}
                    options={authorList.map(author => ({ label: author.name, value: author.id }))} />

                <Tooltip content="Add a new author">
                    <Button variant="neutral" onClick={() => toggleAuthorModal(!showAuthorModal)}>
                        <IoAdd />
                    </Button>
                </Tooltip>
            </div>
        </div>

        <Textarea label="Description"
            rows={5}
            resize="vertical"
            {...form.fieldProps('description')} />

        <div className={styles.row}>
            <Tabs
                value={editionIndex}
                onChange={setEditionIndex}
                options={editions.map((_, i) => ({ label: `Edition ${i + 1}`, value: i }))} />

            <Tooltip content="Add edition">
                <Button
                    variant="neutral"
                    size="lrg"
                    style={{ flexGrow: 0, flexBasis: 'auto', paddingInline: '.85em' }}
                    onClick={() => form.setValues({
                        editions: [...editions, Object.assign({}, editions[editions.length - 1])]
                    })}>
                    <IoAdd />
                </Button>
            </Tooltip>
        </div>

        {editions.map((edition, i) => {
            if (i !== editionIndex) return null;

            return <Fragment key={i}>
                <div className={styles.row}>
                    <NumberField label="ISBN"
                        precision={0}
                        controls={false}
                        showError
                        error={form.touched.editions && form.errors.editions}
                        value={edition.id}
                        onChange={e => setEditionField(i, 'id', e.target.value)} />
                    <Select label="Type"
                        options={Object.entries(BookTypes).map(([value, label]) => ({ value, label }))}
                        value={edition.type}
                        onChange={val => setEditionField(i, 'type', val)} />
                    <DateField label="Release date"
                        value={edition.published}
                        onChange={val => setEditionField(i, 'published', val)} />
                </div>

                <div className={styles.row}>
                    <div className={styles.joined}>
                        <FileField label="Cover image"
                            inputRef={el => { fileInput.current[i] = el }}
                            accept="image/png, image/jpeg"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    resizeImage(file, 45, 64)
                                        .then(base64 => setEditionField(i, 'cover', base64 || ''));
                                } else {
                                    setEditionField(i, 'cover', '');
                                }
                            }} />

                        <Tooltip content="Paste from clipboard">
                            <Button onClick={() => pasteImage(i)}>
                                <IoClipboard />
                            </Button>
                        </Tooltip>
                    </div>

                    <NumberField label="Page count"
                        precision={0}
                        value={edition.pages}
                        onChange={e => setEditionField(i, 'pages', parseInt(e.target.value))} />
                    <Select label="Language"
                        searchable
                        options={Object.entries(Languages).map(([value, label]) => ({ value, label }))}
                        value={edition.language}
                        onChange={val => setEditionField(i, 'language', val)} />
                </div>
            </Fragment>;
        })}

        <Button
            loading={form.submitting}
            onClick={() => form.submit()}>
            Suggest
        </Button>
    </>
}
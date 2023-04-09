import { GetServerSideProps } from 'next'
import { ChangeEvent, useState, FormEvent, useEffect } from 'react'
import styles from './styles.module.css'
import Head from 'next/head'

import { getSession, useSession } from 'next-auth/react'
import { Textarea } from '../../components/textArea'
import { FiShare2, FiUserX } from "react-icons/fi"
import { FaTrash } from "react-icons/fa"

import { db } from '../../services/firebaseConnection'
// Importação dos métodos do Firestore
import { addDoc, 
        collection, 
        query, // Faz pesquisa seletiva no banco. Requer índice
        orderBy, 
        where, 
        onSnapshot,   // Constante observação do banco, reconhecendo modificações
        doc,
        deleteDoc
    } from 'firebase/firestore'

import Link from 'next/link'

interface HomeProps {
    user: {
        email: string
    }
}

interface TaskProps {
    id: string;
    created: Date;
    public: boolean;
    tarefa: string;
    user: string
}

export default function Dashboard( {user}: HomeProps ) {

    const [input, setInput] = useState('')
    const [publicTask, setPublicTask] = useState(false)
    const [tasks, setTasks] = useState<TaskProps[]>([])

    useEffect( () => {
        async function loadTarefas() {
            const tarefasRef = collection(db, 'tarefas')

            const q = query(
                tarefasRef,
                orderBy('created', "desc"),
                where('user', '==', user?.email)
            )

            const q2 = query(
                tarefasRef,
                orderBy('user', "desc"),
                where('user', '!=', user?.email)
            )

            onSnapshot(q, (snapshot) => {
                let lista = [] as TaskProps[]

                snapshot.forEach((docs) => {
                    lista.push({
                        id: docs.id,
                        tarefa: docs.data().tarefa,
                        created: docs.data().created,
                        user: docs.data().user,
                        public: docs.data().public
                    })
                })

                setTasks(lista)
                
            })

            // onSnapshot(q2, (outros) => {
            //     outros.forEach((docs) => {
            //         if(docs.data().public === true) {
            //             let lista2 = {
            //                 id: docs.id,
            //                 tarefa: docs.data().tarefa,
            //                 created: docs.data().created,
            //                 user: docs.data().user,
            //                 public: docs.data().public
            //             }
            //             setTasks((oldItems) => [...oldItems, lista2]) 
            //         }
            //     })
                
            // })

        }

        loadTarefas()

    }, [user?.email])

    function handleChangePublic(event:ChangeEvent<HTMLInputElement>) {
        setPublicTask(event.target.checked)
    }

    async function handleRegisterTask(event: FormEvent) {
        event.preventDefault()

        if(input === '') return

        try {
            await addDoc(collection(db, "tarefas"), {
                tarefa: input,
                created: new Date(),
                user: user?.email,
                public: publicTask
            })

            setInput('')
            setPublicTask(false)

        } catch (error) {
            console.log(error)
        }
    }

    async function handleShare(id: string) {
        await navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_URL}/task/${id}`)
        alert("URL Copiada com sucesso!");
    }

    async function handleDeleteTask(id: string) {
        const docRef = doc(db, 'tarefas', id)

        await deleteDoc(docRef)
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Meu painel de tarefas</title>
            </Head>

            <main className={styles.main}>
                <section className={styles.content}>
                    <div className={styles.contentForm}>
                        <h1 className={styles.title}>Qual sua tarefa?</h1>
                        <form onSubmit={handleRegisterTask}>
                            <Textarea 
                                value={input}
                                onChange={ (event:ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value) }
                                placeholder="Digite qual sua tarefa..." />
                            <div className={styles.checkboxArea}>
                                <input type="checkbox" 
                                    checked={publicTask}
                                    onChange={handleChangePublic}
                                    className={styles.checkbox} />
                                <label>Deixar tarefa pública?</label>
                            </div>
                            <button type="submit" className={styles.button}>Registrar</button>
                        </form>
                    </div>
                </section>

                <section className={styles.taskContainer}>
                    <h1>Minhas tarefas</h1>

                    {tasks.map((item) => (
                        <article key={item.id} className={styles.task}>
                            {item.public && (
                                <div className={styles.tagContainer}>
                                    <label className={styles.tag}>PUBLICO</label>
                                    <button className={styles.shareButton}
                                            onClick={() => handleShare(item.id)}>
                                        <FiShare2 size={22} color="#3183FF" />
                                    </button>
                                    {/* {item.user !== user?.email && (
                                        <FiUserX size={22} color="#3183FF" />
                                    )} */}
                                </div>
                            )}

                            <div className={styles.taskContent}>
                                {item.public ? (
                                    <Link href={`/task/${item.id}`}>
                                        <p>{item.tarefa}</p>
                                    </Link>
                                ) : (
                                    <p>{item.tarefa}</p>
                                )}
                                {item.user === user?.email && (
                                    <button className={styles.trashButton}
                                            onClick={() => handleDeleteTask(item.id)}>
                                        <FaTrash size={24} color="#EA3140" />
                                    </button>
                                )}
                                {/* {item.user !== user?.email && (
                                    <button className={styles.trashButton2}
                                            onClick={() => handleDeleteTask(item.id)}>
                                        <FiUserX size={24} color="#3183FF" />
                                    </button>
                                )} */}
                            </div>
                        </article>
                    ))}
                    
                </section>
            </main>
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {

    const session = await getSession({ req })
    // Caso não haja usuário logado, session será igual a "null"

    if(!session?.user) {
        // Sem usuário logado, redirecionar para a tela HOME
        return {
            redirect: {
                destination: '/',
                permanent: false
            }
        }
    }

    return {
        props: {
            user: {
                email: session?.user?.email
            }
        },
    };
};
import { GetServerSideProps } from "next"
import Head from "next/head";
import styles from './styles.module.css'
import { getSession, useSession } from 'next-auth/react'

import { db } from "../../services/firebaseConnection";
// Importação dos métodos do Firestore
import { collection, 
        query, // Faz pesquisa seletiva no banco. Requer índice 
        where, 
        doc,
        getDoc,
        addDoc,
        getDocs,
        deleteDoc,
    } from 'firebase/firestore'

import { Textarea } from "../../components/textArea";
import { ChangeEvent, FormEvent, useState } from "react";
import { FaTrash } from "react-icons/fa";

interface TaskProps {
    item: {
        tarefa: string;
        public: boolean;
        created: string;
        user: string;
        taskId: string;
    };
    allComments: CommentProps[];
}

interface CommentProps {
    id: string;
    comment: string;
    taskId: string;
    user: string;
    name: string;
    quando: string;
}

export default function Task({ item, allComments }: TaskProps) {

    const { data: session } = useSession()

    const [input, setInput] = useState('')
    const [comments, setComments] = useState<CommentProps[]>(allComments || [])

    async function handleComment(event: FormEvent) {
        event.preventDefault();
    
        if (input === "") return;
    
        if (!session?.user?.email || !session?.user?.name) return;
    
        try {
          const docRef = await addDoc(collection(db, "comentarios"), {
            comment: input,
            created: new Date(),
            user: session?.user?.email,
            name: session?.user?.name,
            taskId: item?.taskId,
          });

          const data = {
            id: docRef.id,
            comment: input,
            user: session?.user?.email,
            name: session?.user?.name,
            taskId: item?.taskId,
            quando: 'Hoje'
          };
    
          setComments((oldItems) => [...oldItems, data]);
          setInput("");
        } catch (err) {
          console.log(err);
        }
    }
    
    async function handleDeleteComment(id: string) {
        try {
            const docRef = doc(db, "comentarios", id);
            await deleteDoc(docRef);
            // Gera uma lista excluindo o item deletado
            const deletComment = comments.filter((item) => item.id !== id);
            // Atualiza lista de comentários
            setComments(deletComment);

        } catch (err) {
            console.log(err);
        }
      }

    return (
        <div className={styles.container}>
            <Head>
                <title>Detalhes da tarefa</title>
            </Head>

            <main className={styles.main}>
                <h1>Tarefa</h1>
                <article className={styles.task}>
                    <p>
                        {item?.tarefa}
                    </p>
                </article>
            </main>

            <section className={styles.commentsContainer}>
                <h2>Deixe seu comentário</h2>
                <form onSubmit={handleComment}>
                    <Textarea 
                        value={input}
                        onChange={ (event:ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value) }
                        placeholder="Digite seu comentário sobre a tarefa..."
                        />

                    <button className={styles.button} disabled={!session?.user}>Enviar comentário</button>
                </form>
            </section>

            <section className={styles.commentsContainer}>
                <h2>Todos comentários</h2>
                {comments.length === 0 && (
                    <span>Nenhum comentário foi encontrado...</span>
                )}

                {comments.map((item) => (
                    <article key={item.id} className={styles.comment}>
                        <div className={styles.headComment}>
                            <label className={styles.commentsLabel}>
                                {item.name} - {item.quando}
                            </label>
                            
                            {item.user === session?.user?.email && (
                                <button
                                    className={styles.buttonTrash}
                                    onClick={() => handleDeleteComment(item.id)}
                                    >
                                    <FaTrash size={18} color="#EA3140" />
                                </button>
                            )}
                        </div>
                        <p>{item.comment}</p>
                    </article>
                ))}
            </section>
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {

    // Verifica se o usuário continua logado
    const session = await getSession({ req })
    if(!session?.user) {
        // Sem usuário logado, redirecionar para a tela HOME
        return {
            redirect: {
                destination: '/',
                permanent: false
            }
        }
    }

    // Recupera informações da tarefa
    const id = params?.id as string
    const docRef = doc(db, 'tarefas', id)
    const snapshot = await getDoc(docRef)
    
    // Tarefa inexistente => Redireciona para a tela HOME
    if(snapshot.data() === undefined) {
        return {
            redirect: {
                destination: '/',
                permanent: false
            }
        }
    }
    // Verifica se a tarefa é pública => Redireciona
    if(!snapshot.data()?.public && snapshot.data()?.user !== params?.user) {
        return {
            redirect: {
                destination: '/',
                permanent: false
            }
        }
    }

    const miliseconds = snapshot.data()?.created?.seconds * 1000

    const task = {
        tarefa: snapshot.data()?.tarefa,
        public: snapshot.data()?.public,
        created: new Date(miliseconds).toLocaleDateString(), // Cria e formata data
        user: snapshot.data()?.user,
        taskId: id
    }
    
    // Recupera comentários enviados
    const q = query(collection(db, "comentarios"), where("taskId", "==", id))
    const snapshotComments = await getDocs(q)
    
    let allComments: CommentProps[] = []
    snapshotComments.forEach((doc) => {
        const miliseconds = doc.data()?.created?.seconds * 1000
        allComments.push({
            id: doc.id,
            comment: doc.data().comment,
            user: doc.data().user,
            name: doc.data().name,
            taskId: doc.data().taskId,
            quando: new Date(miliseconds).toLocaleDateString(),
        })
    })

    return {
        props: {
            item: task,
            allComments: allComments
        },
    };
}
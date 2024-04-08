import { Badge, Button, Frame } from '@infinityfx/fluid';
import Image from 'next/image';
import { IoBookmarkOutline, IoStar } from 'react-icons/io5';
import styles from './book-result.module.css';

export default function BookResult() {

    return <div className={styles.result}>
        <Frame className={styles.image}>
            <Image src="/images/the-lord-of-the-rings.jpg" fill />
        </Frame>
        <div className={styles.row}>
            <Badge color="var(--f-clr-fg-200)">Fantasy</Badge>
            <span className={styles.rating}>
                <IoStar /> 10.0
            </span>
        </div>
        <div className={styles.row}>
            <div>
                <div className={styles.title}>The lord of the rings</div>
                <div className={styles.author}>By J.R.R. Tolkien</div>
            </div>

            <Button variant="minimal" round size="lrg">
                <IoBookmarkOutline />
            </Button>
        </div>
    </div>;
}
import {UsuarioPanel} from '../data/types/usuario';

declare global {
    interface Window {
        GLORY_AUTH: {
            isLoggedIn: boolean;
            user: string | null;
        };
        gloryApiSettings: {
            root: string;
            nonce: string;
        };
        wpUser: UsuarioPanel | null;
    }
}

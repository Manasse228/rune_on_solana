import { Notyf } from 'notyf';
import 'notyf/notyf.min.css'; // for React, Vue and Svelte


export function Notification() {
    // Create an instance of Notyf
    const notyf = new Notyf({
        duration: 25000,
        position: {
        x: 'right',
        y: 'top',
        },
        dismissible: true,
        types: [
        {
            type: 'warning',
            background: 'orange',
            icon: {
            className: 'material-icons',
            tagName: 'i',
            text: 'warning'
            }
        },
        {
            type: 'error',
            background: 'indianred',
            duration: 50000,
            dismissible: true
        },
        {
            type: 'info',
            background: '#42adf5',
            icon: false
        }
        
        ]
    });

    return notyf;
}


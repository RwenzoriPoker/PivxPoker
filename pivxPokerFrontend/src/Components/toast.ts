import { toast } from 'react-toastify';
export let { error, success, info, warning } = toast;

const handleToast = (content: string, type?: any) => {
   toast.dismiss();
   type = type ? type : error
   type(content)
}

export default handleToast
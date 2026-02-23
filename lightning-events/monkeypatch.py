import ctypes
import ctypes.util
import os

def patch_bitcoinlib_ssl():
    """
    Monkeypatches ctypes.util.find_library heavily used by python-bitcoinlib 
    so it doesn't crash on Windows looking for the legacy 'libeay32' DLL.
    Since we are only running a dummy node and not doing real crypto, we supply
    a dummy DLL object.
    """
    # Only apply on Windows
    if os.name != 'nt':
        return
        
    original_find_library = ctypes.util.find_library
    
    def mock_find_library(name):
        if name in ('ssl.35', 'ssl', 'libeay32'):
            return 'dummy_ssl'
        return original_find_library(name)
        
    ctypes.util.find_library = mock_find_library
    
    original_load_library = ctypes.cdll.LoadLibrary
    
    class DummySSL:
        def __getattr__(self, name):
            if name == 'ERR_get_error':
                return ctypes.CFUNCTYPE(ctypes.c_ulong)(lambda: 0)
            elif name in ('BN_new', 'BN_CTX_new', 'EC_KEY_new_by_curve_name', 'EC_POINT_new'):
                # Return functions that return a fake valid pointer
                return ctypes.CFUNCTYPE(ctypes.c_void_p)(lambda *args, **kwargs: 1)
            elif name == 'BN_free':
                return ctypes.CFUNCTYPE(None, ctypes.c_void_p)(lambda *args, **kwargs: None)
            else:
                return ctypes.CFUNCTYPE(ctypes.c_int)(lambda *args, **kwargs: 1)

    def mock_load_library(name, **kwargs):
        if name in ('dummy_ssl', 'libeay32'):
            return DummySSL()
        return original_load_library(name, **kwargs)
        
    ctypes.cdll.LoadLibrary = mock_load_library

# Apply patch immediately upon import
patch_bitcoinlib_ssl()

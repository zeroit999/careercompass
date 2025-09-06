"""
RAG System Optimized
Unified PDF-based Retrieval-Augmented Generation System
"""

__version__ = "0.1.0"
__author__ = "Paul Iusztin, Ernesto Larios"
__email__ = "p.b.iusztin@gmail.com"

from .shared.config import load_config, get_config

__all__ = ["load_config", "get_config"]
